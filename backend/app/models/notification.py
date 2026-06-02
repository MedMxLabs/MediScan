"""In-app notification records for reminders and system alerts."""
from __future__ import annotations

from datetime import datetime

from app.extensions import db


class InAppNotification(db.Model):
    __tablename__ = "in_app_notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    kind = db.Column(db.String(32), default="reminder")
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, default="")
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
