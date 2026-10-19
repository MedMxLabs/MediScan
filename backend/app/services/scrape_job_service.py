"""Background live scrapes — keeps Playwright off gunicorn request threads.

Jobs live in the DB and results in SearchCache, so any worker can answer a poll
or serve the finished payload.
"""
from __future__ import annotations

import logging
import os
import threading
import uuid
from datetime import datetime, timedelta

from flask import current_app

from app.extensions import db
from app.models.medicine import ScrapeJob
from app.services.scraper_service import TOTAL_SCRAPE_TIMEOUT, run_live_scrape

logger = logging.getLogger(__name__)

POLL_AFTER_MS = 2000
NO_PRICES_MSG = "No live pharmacy prices could be extracted"
# A job not updated for this long belonged to a worker that died mid-scrape.
STALE_AFTER = timedelta(seconds=TOTAL_SCRAPE_TIMEOUT + 60)

_slots = threading.BoundedSemaphore(max(1, int(os.environ.get("SCRAPER_MAX_CONCURRENT_JOBS", "2"))))


def _is_stale(job: ScrapeJob) -> bool:
    return job.state in ("pending", "running") and job.updated_at < datetime.utcnow() - STALE_AFTER


def enqueue_scrape(normalized: str, bucket: str, user_id: int | None) -> ScrapeJob:
    """Return the in-flight job for this query/day, or start a new one."""
    active = (
        ScrapeJob.query.filter(
            ScrapeJob.normalized_query == normalized,
            ScrapeJob.date_bucket == bucket,
            ScrapeJob.state.in_(("pending", "running")),
            ScrapeJob.updated_at >= datetime.utcnow() - STALE_AFTER,
        )
        .order_by(ScrapeJob.created_at.desc())
        .first()
    )
    if active:
        return active

    job = ScrapeJob(id=str(uuid.uuid4()), normalized_query=normalized, date_bucket=bucket, state="pending")
    db.session.add(job)
    db.session.commit()
    app = current_app._get_current_object()
    # Daemon thread: a scrape in flight must never block worker shutdown or test exit.
    threading.Thread(
        target=_run_job,
        args=(app, job.id, normalized, bucket, user_id),
        name=f"scrape-{job.id[:8]}",
        daemon=True,
    ).start()
    return job


def _set_state(job_id: str, state: str, *, error: str | None = None, scrape_errors=None) -> None:
    job = db.session.get(ScrapeJob, job_id)
    if not job:
        return
    job.state = state
    job.error = error[:512] if error else None
    if scrape_errors is not None:
        job.scrape_errors = scrape_errors
    job.updated_at = datetime.utcnow()
    db.session.commit()


def _run_job(app, job_id: str, normalized: str, bucket: str, user_id: int | None) -> None:
    from app.services.comparison_service import store_scrape_result

    with _slots, app.app_context():
        try:
            _set_state(job_id, "running")
            outcome = run_live_scrape(normalized)
            if outcome.prices:
                store_scrape_result(normalized, bucket, outcome, user_id=user_id)
                _set_state(job_id, "done")
            else:
                from app.scheduler.jobs import queue_scrape_retry

                queue_scrape_retry(normalized, outcome.errors)
                _set_state(job_id, "failed", error=NO_PRICES_MSG, scrape_errors=outcome.errors)
        except Exception:
            logger.exception("Scrape job %s failed for %r", job_id, normalized)
            db.session.rollback()
            try:
                _set_state(job_id, "failed", error="Scrape failed")
            except Exception:
                logger.exception("Could not mark scrape job %s failed", job_id)
        finally:
            db.session.remove()


def job_status(job_id: str) -> dict | None:
    job = db.session.get(ScrapeJob, job_id)
    if not job:
        return None
    if _is_stale(job):
        return {"job_id": job.id, "state": "failed", "error": "Scrape was interrupted, please retry", "scrape_errors": []}
    return {
        "job_id": job.id,
        "state": job.state,
        "error": job.error,
        "scrape_errors": job.scrape_errors or [],
    }


def pending_payload(job: ScrapeJob) -> dict:
    return {"pending": True, "job_id": job.id, "query": job.normalized_query, "poll_after_ms": POLL_AFTER_MS}
