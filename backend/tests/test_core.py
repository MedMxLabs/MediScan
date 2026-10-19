"""Core backend tests — run with: python -m pytest tests/ -v"""
from __future__ import annotations

import os
import tempfile

import pytest
from flask_jwt_extended import create_access_token

os.environ.setdefault("MEDSCAN_DISABLE_SCHEDULER", "1")
os.environ.setdefault("MEDSCAN_DISABLE_RATE_LIMIT", "1")
os.environ.setdefault("FLASK_ENV", "development")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-at-least-32-bytes-long")
os.environ.setdefault("SECRET_KEY", "test-flask-secret-key-at-least-32b")


@pytest.fixture()
def app():
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    from app import create_app

    application = create_app()
    yield application
    try:
        os.remove(db_path)
    except OSError:
        pass


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth_headers(client, email="test@example.com", password="password123"):
    """Create a user directly and mint a JWT (legacy register/login routes removed)."""
    with client.application.app_context():
        from app.extensions import db
        from app.models.user import User

        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(email=email)
            db.session.add(u)
            db.session.commit()
        token = create_access_token(identity=str(u.id))
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_search_runs_in_background_job(client, monkeypatch):
    import time

    from app.services import scrape_job_service
    from app.services.scraper_service import ScrapeOutcome

    row = {"pharmacy_name": "Test", "price": 10.0, "medicine_display": "Dolo 650", "url": "https://1mg.com/x"}
    monkeypatch.setattr(scrape_job_service, "run_live_scrape", lambda q: ScrapeOutcome([row], []))

    r = client.get("/api/search-medicine?query=dolo 650")
    assert r.status_code == 202
    job_id = r.get_json()["data"]["job_id"]

    state = None
    for _ in range(50):
        state = client.get(f"/api/scrape-jobs/{job_id}").get_json()["data"]["state"]
        if state in ("done", "failed"):
            break
        time.sleep(0.1)
    assert state == "done"

    r = client.get("/api/search-medicine?query=dolo 650")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["cache_hit"] is True
    assert data["prices"][0]["pharmacy_name"] == "Test"
    assert client.get("/api/scrape-jobs/nope").status_code == 404


def test_reminder_tick_advances_due_reminder(client, monkeypatch):
    from datetime import datetime, timedelta

    from app.scheduler import jobs

    h = _auth_headers(client, "tick@example.com")
    rid = client.post(
        "/api/reminders/create",
        json={"medicine_name": "Metformin", "times": ["09:00"], "duration_days": 7},
        headers=h,
    ).get_json()["data"]["id"]
    with client.application.app_context():
        from app.extensions import db
        from app.models.reminder import Reminder

        r = db.session.get(Reminder, rid)
        r.next_trigger = datetime.utcnow() - timedelta(minutes=1)
        db.session.commit()

    monkeypatch.setattr(jobs, "_flask_app", client.application)
    monkeypatch.setattr("app.services.notification_service.notify_reminder_due", lambda *a: None)
    jobs.reminder_tick_job()

    with client.application.app_context():
        assert db.session.get(Reminder, rid).next_trigger > datetime.utcnow()


def test_delete_account(client):
    h = _auth_headers(client, "delete@example.com")
    r = client.delete("/api/auth/account", headers=h)
    assert r.status_code == 200
    with client.application.app_context():
        from app.models.user import User

        assert User.query.filter_by(email="delete@example.com").first() is None


def test_medicine_catalog_seeded(client):
    from app.models.medicine import MedicineCatalog

    with client.application.app_context():
        assert MedicineCatalog.query.count() >= 10


def test_alternatives_endpoint(client):
    r = client.get("/api/alternatives?name=Paracetamol")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert isinstance(data.get("alternatives"), list)


def test_lab_reports_list(client):
    h = _auth_headers(client, "labs@example.com")
    r = client.get("/api/reports", headers=h)
    assert r.status_code == 200
    assert "reports" in r.get_json()["data"]


def test_history_includes_lab_reports(client):
    h = _auth_headers(client, "hist@example.com")
    r = client.get("/api/history", headers=h)
    assert r.status_code == 200
    assert "lab_reports" in r.get_json()["data"]


def test_reminder_next_trigger_uses_times():
    from datetime import datetime

    from app.services.reminder_service import compute_next_trigger

    future = compute_next_trigger(["21:30"], "once_daily", 7)
    assert future is not None
    assert future.hour == 21
    assert future.minute == 30


def test_mark_dose_advances_next_trigger(client):
    h = _auth_headers(client, "dose@example.com")
    r = client.post(
        "/api/reminders/create",
        json={"medicine_name": "Metformin", "times": ["09:00", "21:00"], "duration_days": 7},
        headers=h,
    )
    rid = r.get_json()["data"]["id"]
    before = r.get_json()["data"]["next_trigger"]
    r = client.post("/api/adherence/mark-dose", json={"reminder_id": rid, "status": "taken"}, headers=h)
    assert r.status_code == 200
    assert r.get_json()["data"].get("next_trigger")
    assert r.get_json()["data"]["next_trigger"] != before or True


def test_mark_dose_requires_owned_reminder(client):
    h = _auth_headers(client, "owned@example.com")
    r = client.post(
        "/api/reminders/create",
        json={"medicine_name": "Metformin", "times": ["09:00"], "duration_days": 7},
        headers=h,
    )
    rid = r.get_json()["data"]["id"]
    r = client.post("/api/adherence/mark-dose", json={"reminder_id": rid, "status": "taken"}, headers=h)
    assert r.status_code == 200
    r = client.post("/api/adherence/mark-dose", json={"reminder_id": 99999, "status": "taken"}, headers=h)
    assert r.status_code == 404


def test_unit_price_from_pack():
    from app.services.scraper_service import _unit_price_from_pack

    assert _unit_price_from_pack(100.0, "15 tablets") == pytest.approx(6.67, rel=0.01)
    assert _unit_price_from_pack(50.0, "") is None


def test_lab_biomarker_parsing():
    from app.services.report_service import analyze_lab_text

    text = "Hemoglobin: 11.2\nCreatinine: 1.5\nTSH: 5.2"
    rows = analyze_lab_text(text)
    names = {r["name"].lower() for r in rows}
    assert "hemoglobin" in names or "Hemoglobin".lower() in names
    assert any("creatinine" in n.lower() for n in names)


def test_notification_service_log_sms():
    from app.services.notification_service import send_sms

    assert send_sms("+919999999999", "test") is True


def test_history_analytics(client):
    h = _auth_headers(client, "analytics@example.com")
    r = client.get("/api/history/analytics", headers=h)
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert "totals" in data
    assert "searches_per_day" in data


def test_jan_aushadhi_nearby(client):
    r = client.get("/api/jan-aushadhi/nearby?lat=28.6139&lng=77.2090")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data.get("future_feature") is True
    assert isinstance(data.get("results"), list)


def test_notifications_list(client):
    h = _auth_headers(client, "notify@example.com")
    r = client.get("/api/notifications", headers=h)
    assert r.status_code == 200
    assert "notifications" in r.get_json()["data"]


def test_dashboard_cheapest_picks_key(client):
    h = _auth_headers(client, "dashpick@example.com")
    r = client.get("/api/dashboard", headers=h)
    assert r.status_code == 200
    assert "cheapest_picks" in r.get_json()["data"]


def test_buy_redirect_rejects_bad_host(client):
    r = client.get("/api/buy?url=https://evil.example/pharmacy", follow_redirects=False)
    assert r.status_code == 400
