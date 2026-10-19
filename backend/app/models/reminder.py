from datetime import datetime

from app.extensions import db


class Reminder(db.Model):
    __tablename__ = "reminders"
    __table_args__ = (db.Index("ix_reminders_status_next_trigger", "status", "next_trigger"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    medicine_name = db.Column(db.String(512), nullable=False)
    dose = db.Column(db.String(128), nullable=True)
    schedule = db.Column(db.JSON, default=dict)
    frequency = db.Column(db.String(64), nullable=True)
    duration_days = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(32), default="active")
    next_trigger = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class AdherenceLog(db.Model):
    __tablename__ = "adherence_logs"
    __table_args__ = (db.Index("ix_adherence_logs_user_id_taken_at", "user_id", "taken_at"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reminder_id = db.Column(db.Integer, db.ForeignKey("reminders.id"), nullable=False)
    taken_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(16), nullable=False)  # taken | missed

