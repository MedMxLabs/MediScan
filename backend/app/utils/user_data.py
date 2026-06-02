"""Delete user activity data and uploaded files."""
from __future__ import annotations

from app.extensions import db
from app.models.prescription import Prescription
from app.models.report import LabReport
from app.models.reminder import AdherenceLog, Reminder
from app.models.search_history import SearchHistory
from app.models.user import User
from app.utils.redis_cache import cache_key_dashboard, delete_cache_key
from app.utils.upload_cleanup import safe_remove_file


def purge_user_activity(uid: int) -> None:
    rx_rows = Prescription.query.filter_by(user_id=uid).all()
    lab_rows = LabReport.query.filter_by(user_id=uid).all()
    upload_paths = [r.image_path for r in rx_rows + lab_rows if r.image_path]

    AdherenceLog.query.filter_by(user_id=uid).delete(synchronize_session=False)
    Reminder.query.filter_by(user_id=uid).delete(synchronize_session=False)
    db.session.query(SearchHistory).filter_by(user_id=uid).delete(synchronize_session=False)
    LabReport.query.filter_by(user_id=uid).delete(synchronize_session=False)
    Prescription.query.filter_by(user_id=uid).delete(synchronize_session=False)
    db.session.commit()
    for path in upload_paths:
        safe_remove_file(path)
    delete_cache_key(cache_key_dashboard(uid))


def delete_user_account(uid: int) -> bool:
    u = User.query.get(uid)
    if not u:
        return False
    purge_user_activity(uid)
    db.session.delete(u)
    db.session.commit()
    return True
