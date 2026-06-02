"""Medicine / activity history with pagination."""
from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.prescription import Prescription
from app.models.report import LabReport
from app.models.search_history import SearchHistory
from app.utils.responses import ok

bp = Blueprint("history", __name__, url_prefix="/api")


@bp.get("/history")
@jwt_required()
def history():
    uid = int(get_jwt_identity())
    page = request.args.get("page", type=int, default=1)
    per_page = min(request.args.get("per_page", type=int, default=20), 100)
    offset = max(0, (page - 1) * per_page)

    sq = db.session.query(SearchHistory).filter_by(user_id=uid).order_by(SearchHistory.created_at.desc())
    total_searches = sq.count()
    searches = sq.offset(offset).limit(per_page).all()

    rx = (
        Prescription.query.filter_by(user_id=uid)
        .order_by(Prescription.uploaded_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    labs = (
        LabReport.query.filter_by(user_id=uid)
        .order_by(LabReport.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return ok(
        {
            "page": page,
            "per_page": per_page,
            "total_searches": total_searches,
            "searches": [
                {"id": s.id, "query": s.query, "summary": s.summary_json, "created_at": s.created_at.isoformat()}
                for s in searches
            ],
            "prescriptions": [
                {
                    "id": p.id,
                    "medicine_list": p.medicine_list,
                    "uploaded_at": p.uploaded_at.isoformat(),
                }
                for p in rx
            ],
            "lab_reports": [
                {
                    "id": lr.id,
                    "row_count": len(lr.extracted_values or []),
                    "insights_preview": (lr.analysis_result or "")[:160],
                    "created_at": lr.created_at.isoformat(),
                }
                for lr in labs
            ],
        }
    )


@bp.get("/history/analytics")
@jwt_required()
def history_analytics():
    """Aggregated activity stats for history analytics charts."""
    uid = int(get_jwt_identity())
    searches = (
        db.session.query(SearchHistory)
        .filter_by(user_id=uid)
        .order_by(SearchHistory.created_at.desc())
        .limit(200)
        .all()
    )
    rx_count = Prescription.query.filter_by(user_id=uid).count()
    lab_count = LabReport.query.filter_by(user_id=uid).count()

    from collections import Counter
    from datetime import datetime, timedelta

    query_counts = Counter(s.query.lower().strip() for s in searches if s.query)
    top_queries = [{"query": q, "count": c} for q, c in query_counts.most_common(8)]

    now = datetime.utcnow()
    week_buckets: dict[str, int] = {}
    for i in range(7):
        d = (now - timedelta(days=i)).date().isoformat()
        week_buckets[d] = 0
    for s in searches:
        if s.created_at:
            d = s.created_at.date().isoformat()
            if d in week_buckets:
                week_buckets[d] += 1

    searches_per_day = sorted(
        [{"date": d, "searches": week_buckets[d]} for d in week_buckets],
        key=lambda r: r["date"],
    )

    return ok(
        {
            "totals": {
                "searches": len(searches),
                "prescriptions": rx_count,
                "lab_reports": lab_count,
            },
            "top_queries": top_queries,
            "searches_per_day": searches_per_day,
        }
    )
