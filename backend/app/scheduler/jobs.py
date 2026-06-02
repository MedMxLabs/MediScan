"""APScheduler background jobs — reminders, cache housekeeping."""
from __future__ import annotations

import atexit
import json
import logging
import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None
_flask_app = None


def reminder_tick_job():
    """Dispatch due reminder notifications when user prefs allow."""
    if _flask_app is None:
        return
    with _flask_app.app_context():
        try:
            from app.models.reminder import Reminder
            from app.models.user import User
            from app.services.notification_service import notify_reminder_due

            now = datetime.utcnow()
            due = (
                Reminder.query.filter(
                    Reminder.status == "active",
                    Reminder.next_trigger.isnot(None),
                    Reminder.next_trigger <= now,
                )
                .limit(50)
                .all()
            )
            for r in due:
                u = User.query.get(r.user_id)
                if not u:
                    continue
                prefs = u.preferences if isinstance(u.preferences, dict) else {}
                if prefs.get("notifications_enabled", True) is False:
                    continue
                notify_reminder_due(
                    u.email if prefs.get("email_digest", True) else "",
                    u.phone if prefs.get("sms_alerts", False) else "",
                    r.medicine_name,
                    r.dose,
                )
                try:
                    from app.routes.notifications import create_in_app_notification

                    create_in_app_notification(
                        r.user_id,
                        title=f"Reminder: {r.medicine_name}",
                        body=f"Time to take {r.dose or 'your dose'}.",
                        kind="reminder",
                    )
                except Exception:
                    pass
            if due:
                logger.info("reminder_tick: processed %d due reminders", len(due))
        except Exception as exc:
            logger.debug("reminder_tick_job skipped: %s", exc)


def cache_sweep_job():
    """Trim stale DB search cache rows older than 30 days."""
    if _flask_app is None:
        return
    with _flask_app.app_context():
        try:
            from app.extensions import db
            from app.models.medicine import SearchCache

            cutoff = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
            deleted = SearchCache.query.filter(SearchCache.date_bucket < cutoff).delete(
                synchronize_session=False
            )
            if deleted:
                db.session.commit()
                logger.info("cache_sweep: removed %d stale search_cache rows", deleted)
        except Exception as exc:
            logger.debug("cache_sweep_job: %s", exc)


def scraper_retry_job():
    """Retry failed scrape queries stored in Redis (if configured)."""
    from app.utils.redis_cache import get_cache, set_cache

    key = "medscan:scrape_retry_queue"
    queue = get_cache(key)
    if not isinstance(queue, list) or not queue:
        return
    if _flask_app is None:
        return
    with _flask_app.app_context():
        from app.services.comparison_service import search_medicine

        remaining = []
        for item in queue[:3]:
            query = item.get("query") if isinstance(item, dict) else str(item)
            if not query:
                continue
            try:
                search_medicine(query, user_id=None, force_refresh=True)
            except Exception as exc:
                logger.debug("scraper retry failed for %r: %s", query, exc)
                remaining.append(item)
        tail = queue[3:] if len(queue) > 3 else []
        set_cache(key, remaining + tail, ttl_seconds=86400)


def queue_scrape_retry(query: str, errors: list | None = None) -> None:
    from app.utils.redis_cache import get_cache, set_cache

    key = "medscan:scrape_retry_queue"
    queue = get_cache(key)
    if not isinstance(queue, list):
        queue = []
    queue.append({"query": query, "errors": errors or [], "at": datetime.utcnow().isoformat() + "Z"})
    set_cache(key, queue[-50:], ttl_seconds=86400)


def init_scheduler(app):
    global _scheduler, _flask_app
    _flask_app = app
    if os.environ.get("MEDSCAN_DISABLE_SCHEDULER", "").lower() in ("1", "true", "yes"):
        return
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(reminder_tick_job, "interval", minutes=15, id="reminder_tick", replace_existing=True)
    _scheduler.add_job(cache_sweep_job, "interval", hours=6, id="cache_sweep", replace_existing=True)
    _scheduler.add_job(scraper_retry_job, "interval", hours=1, id="scraper_retry", replace_existing=True)
    _scheduler.start()
    atexit.register(lambda: _scheduler.shutdown(wait=False) if _scheduler else None)
    logger.info("APScheduler started")
