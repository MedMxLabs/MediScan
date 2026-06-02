"""In-app notification feed."""
from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.notification import InAppNotification
from app.utils.responses import err, ok

bp = Blueprint("notifications", __name__, url_prefix="/api")


@bp.get("/notifications")
@jwt_required()
def list_notifications():
    uid = int(get_jwt_identity())
    limit = min(int(request.args.get("limit", 30)), 100)
    rows = (
        InAppNotification.query.filter_by(user_id=uid)
        .order_by(InAppNotification.created_at.desc())
        .limit(limit)
        .all()
    )
    unread = InAppNotification.query.filter_by(user_id=uid, read=False).count()
    return ok(
        {
            "unread_count": unread,
            "notifications": [
                {
                    "id": n.id,
                    "kind": n.kind,
                    "title": n.title,
                    "body": n.body,
                    "read": n.read,
                    "created_at": n.created_at.isoformat(),
                }
                for n in rows
            ],
        }
    )


@bp.patch("/notifications/<int:nid>/read")
@jwt_required()
def mark_read(nid: int):
    uid = int(get_jwt_identity())
    n = InAppNotification.query.filter_by(id=nid, user_id=uid).first()
    if not n:
        return err("notification not found", status=404)
    n.read = True
    db.session.commit()
    return ok({"id": n.id, "read": True})


def create_in_app_notification(user_id: int, title: str, body: str = "", kind: str = "reminder") -> None:
    """Persist an in-app notification (best-effort)."""
    try:
        db.session.add(
            InAppNotification(user_id=user_id, kind=kind, title=title, body=body or "", read=False)
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
