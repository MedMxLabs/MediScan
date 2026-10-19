"""Poll background scrape jobs started by /api/search-medicine and /api/compare."""
from __future__ import annotations

from flask import Blueprint

from app.services.scrape_job_service import job_status
from app.utils.responses import err, ok

bp = Blueprint("scrape_jobs", __name__, url_prefix="/api")


@bp.get("/scrape-jobs/<job_id>")
def scrape_job_status(job_id: str):
    status = job_status(job_id)
    if status is None:
        return err("Scrape job not found", status=404)
    return ok(status)
