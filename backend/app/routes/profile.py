"""User profile and preferences."""
from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User
from app.utils.responses import err, ok
from app.utils.user_data import purge_user_activity

bp = Blueprint("profile", __name__, url_prefix="/api")


@bp.get("/profile")
@jwt_required()
def get_profile():
    uid = int(get_jwt_identity())
    u = User.query.get(uid)
    if not u:
        return err("User not found", status=404)
    prefs = u.preferences if isinstance(u.preferences, dict) else {}
    return ok(
        {
            "id": u.id,
            "email": u.email,
            "name": u.name or "",
            "phone": u.phone or "",
            "date_of_birth": u.date_of_birth or "",
            "gender": u.gender or "",
            "role": u.role,
            "preferences": prefs,
            "notifications_enabled": prefs.get("notifications_enabled", True),
            "email_digest": prefs.get("email_digest", False),
            "sms_alerts": prefs.get("sms_alerts", False),
        }
    )


@bp.patch("/profile/update")
@jwt_required()
def update_profile():
    uid = int(get_jwt_identity())
    u = User.query.get(uid)
    if not u:
        return err("User not found", status=404)
    data = request.get_json(silent=True) or {}

    for field in ("name", "phone", "date_of_birth", "gender"):
        if field in data:
            setattr(u, field, (data[field] or "").strip())

    prefs = dict(u.preferences) if isinstance(u.preferences, dict) else {}
    for key in ("notifications_enabled", "email_digest", "sms_alerts", "theme"):
        if key in data:
            prefs[key] = data[key]
    u.preferences = prefs
    db.session.commit()
    return ok(
        {
            "name": u.name or "",
            "phone": u.phone or "",
            "date_of_birth": u.date_of_birth or "",
            "gender": u.gender or "",
            "preferences": prefs,
        },
        message="Profile updated",
    )


@bp.post("/profile/reset-data")
@jwt_required()
def reset_user_activity():
    """Delete all activity data for the current user."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return err("User not found", status=404)
    purge_user_activity(uid)
    return ok({"reset": True}, message="All activity data cleared.")
