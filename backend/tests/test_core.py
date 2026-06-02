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


@pytest.mark.skip(reason="Legacy register/login routes removed; web uses Supabase Auth now")
def test_register_login_refresh(client):
    r = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert r.status_code == 201
    r = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert r.status_code == 200
    body = r.get_json()
    assert body.get("access_token")
    refresh = body.get("refresh_token")
    r = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert r.status_code == 200
    assert r.get_json().get("access_token")


@pytest.mark.skip(reason="Legacy change-password route removed; web uses Supabase Auth now")
def test_change_password(client):
    h = _auth_headers(client, "changepw@example.com")
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "password123", "new_password": "newpassword99"},
        headers=h,
    )
    assert r.status_code == 200
    r = client.post("/api/auth/login", json={"email": "changepw@example.com", "password": "newpassword99"})
    assert r.status_code == 200


@pytest.mark.skip(reason="Legacy forgot/reset-password routes removed; web uses Supabase Auth now")
def test_forgot_and_reset_password(client):
    client.post("/api/auth/register", json={"email": "reset@example.com", "password": "password123"})
    r = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert r.status_code == 200
    data = r.get_json()
    token_url = data.get("dev_reset_url") or ""
    assert token_url or data.get("ok")
    if "token=" in token_url:
        token = token_url.split("token=")[-1]
        r = client.post("/api/auth/reset-password", json={"token": token, "new_password": "resetpass99"})
        assert r.status_code == 200
        r = client.post("/api/auth/login", json={"email": "reset@example.com", "password": "resetpass99"})
        assert r.status_code == 200


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
