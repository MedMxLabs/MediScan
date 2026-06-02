"""Dashboard API — Redis-cached summary."""
from __future__ import annotations

import json
from datetime import datetime, timedelta

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.prescription import Prescription
from app.models.reminder import AdherenceLog, Reminder
from app.models.search_history import SearchHistory
from app.services.comparison_service import search_medicine
from app.utils.logger import get_logger
from app.utils.redis_cache import cache_key_dashboard, get_cache, set_cache
from app.utils.responses import err, ok

bp = Blueprint("dashboard", __name__, url_prefix="/api")

logger = get_logger(__name__)


def _summary_as_dict(raw):
    """SearchHistory.summary_json is JSON; tolerate legacy string / wrong types."""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


def _build_dashboard(uid: int):
    upcoming = Reminder.query.filter_by(user_id=uid, status="active").order_by(Reminder.next_trigger.asc()).limit(8).all()
    total_rx = Prescription.query.filter_by(user_id=uid).count()
    tracked = Reminder.query.filter_by(user_id=uid, status="active").count()
    day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    doses_today = (
        AdherenceLog.query.filter_by(user_id=uid).filter(AdherenceLog.taken_at >= day_start).count()
    )
    medicines_today = [
        {
            "id": r.id,
            "medicine_name": r.medicine_name,
            "dose": r.dose,
            "next_trigger": r.next_trigger.isoformat() if r.next_trigger else None,
        }
        for r in upcoming
        if r.next_trigger and day_start <= r.next_trigger < day_end
    ]
    logs_all = AdherenceLog.query.filter_by(user_id=uid).limit(400).all()
    taken = sum(1 for x in logs_all if x.status == "taken")
    missed = sum(1 for x in logs_all if x.status == "missed")
    skipped = sum(1 for x in logs_all if x.status == "skipped")
    denom = taken + missed + skipped
    adherence_pct = round(100.0 * taken / denom, 1) if denom else 0.0

    today_logs = [x for x in logs_all if x.taken_at >= day_start and x.taken_at < day_end]
    today_taken = sum(1 for x in today_logs if x.status == "taken")
    today_missed = sum(1 for x in today_logs if x.status == "missed")
    today_skipped = sum(1 for x in today_logs if x.status == "skipped")

    recent = (
        db.session.query(SearchHistory).filter_by(user_id=uid).order_by(SearchHistory.created_at.desc()).limit(8).all()
    )

    # Monthly savings estimate + cheapest picks from recent search summaries
    savings_hint = 0.0
    cheapest_picks: list[dict] = []
    for s in recent:
        summ = _summary_as_dict(s.summary_json)
        ch = summ.get("cheapest") if isinstance(summ.get("cheapest"), dict) else {}
        try:
            savings_hint += float(ch.get("price") or 0) * 0.05
        except (TypeError, ValueError):
            pass
        if ch and ch.get("pharmacy_name") and len(cheapest_picks) < 6:
            cheapest_picks.append(
                {
                    "query": s.query,
                    "medicine": summ.get("medicine_display") or s.query,
                    "pharmacy_name": ch.get("pharmacy_name"),
                    "price": ch.get("price"),
                    "unit_price": ch.get("unit_price"),
                    "url": ch.get("url"),
                    "searched_at": s.created_at.isoformat() if s.created_at else None,
                }
            )

    return {
        "reminders_preview": [
            {
                "id": r.id,
                "medicine_name": r.medicine_name,
                "next_trigger": r.next_trigger.isoformat()
                if hasattr(r.next_trigger, "isoformat")
                else None,
                "dose": r.dose,
            }
            for r in upcoming
        ],
        "stats": {
            "prescriptions_saved": total_rx,
            "doses_logged_today": doses_today,
            "medicines_tracked": tracked,
            "adherence_score_percent": adherence_pct,
            "monthly_savings_estimate_inr": round(savings_hint, 2),
        },
        "recent_searches": [
            {
                "query": x.query,
                "created_at": x.created_at.isoformat() if hasattr(x.created_at, "isoformat") else None,
            }
            for x in recent
        ],
        "medicines_today": medicines_today,
        "cheapest_picks": cheapest_picks,
        "adherence_preview": {"taken": taken, "missed": missed, "skipped": skipped},
        "today_progress": {
            "taken": today_taken,
            "missed": today_missed,
            "skipped": today_skipped,
        },
    }


@bp.get("/dashboard")
@jwt_required()
def dashboard():
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return err("Invalid session", status=401)
    key = cache_key_dashboard(uid)
    bypass = request.args.get("refresh") == "1"
    if not bypass:
        cached = get_cache(key)
        if cached:
            return ok(cached)
    try:
        payload = _build_dashboard(uid)
    except Exception:
        logger.exception("dashboard failed for user_id=%s", uid)
        return err("Dashboard temporarily unavailable", status=500)
    set_cache(key, payload)
    return ok(payload)


@bp.get("/dashboard/compare-preview")
@jwt_required()
def dashboard_compare_preview():
    """Optional: run live compare for last search query (heavy)."""
    uid = int(get_jwt_identity())
    recent = db.session.query(SearchHistory).filter_by(user_id=uid).order_by(SearchHistory.created_at.desc()).first()
    if not recent:
        return ok(None)
    payload, code, _msg = search_medicine(recent.query, user_id=None)
    if code:
        return ok({"error": "compare_failed", "detail": payload})
    return ok(payload)
