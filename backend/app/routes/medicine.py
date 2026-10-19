"""Medicine search, comparison, catalog."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.medicine import MedicineCatalog
from app.services.comparison_service import PENDING, compare_medicine, search_medicine
from app.services.recommendation_service import find_alternatives, suggest_alternatives
from app.utils.logger import get_logger
from app.utils.rate_limit import check_scrape_limit
from app.utils.responses import err, ok

logger = get_logger(__name__)

bp = Blueprint("medicine", __name__, url_prefix="/api")


def _uid_optional():
    try:
        uid = get_jwt_identity()
        if uid is not None and str(uid).isdigit():
            return int(uid)
    except Exception:
        pass
    return None


def _run_scrape_route(fn, query: str, failure_msg: str):
    allowed, msg = check_scrape_limit()
    if not allowed:
        return err(msg or "Rate limited", status=429)
    try:
        payload, code, msg = fn(query, user_id=_uid_optional(), force_refresh=request.args.get("refresh") == "1")
    except Exception:
        logger.exception("Unhandled error in %s for query=%r", fn.__name__, query)
        return err("Internal error", status=500)
    if code == PENDING:
        return ok(payload, status=PENDING)
    if code == 400:
        return err(msg or "Bad request", status=400)
    if code == 502:
        logger.warning("%s scrape failure: %s", fn.__name__, msg)
        return err(msg or failure_msg, status=502, data=payload)
    return ok(payload)


@bp.get("/search-medicine")
@bp.get("/search_medicine")
@jwt_required(optional=True)
def search_medicine_route():
    q = request.args.get("query") or request.args.get("q") or ""
    return _run_scrape_route(search_medicine, q, "Scrape failed")


@bp.get("/compare")
@jwt_required(optional=True)
def compare_route():
    medicine = request.args.get("medicine") or request.args.get("query") or request.args.get("q") or ""
    return _run_scrape_route(compare_medicine, medicine, "Comparison unavailable")


@bp.get("/medicine/<int:mid>")
def medicine_detail(mid: int):
    m = MedicineCatalog.query.get(mid)
    if not m:
        return jsonify(
            {
                "id": mid,
                "name": "Unknown",
                "generic_name": "",
                "composition": "",
                "strength": "",
                "form": "",
                "manufacturer": "",
            }
        )
    return jsonify(
        {
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "composition": m.composition,
            "strength": m.strength,
            "form": m.form,
            "manufacturer": m.manufacturer,
        }
    )


@bp.get("/alternatives")
@jwt_required(optional=True)
def alternatives_alias():
    """Generic alternatives by medicine name. Returns catalog matches by composition / generic name."""
    name = (request.args.get("name") or request.args.get("query") or "").strip()
    if not name:
        return err("name required", status=400)
    seed, items = find_alternatives(name)
    return ok(
        {
            "query": name,
            "seed": (
                {
                    "id": seed.id,
                    "name": seed.name,
                    "generic_name": seed.generic_name,
                    "composition": seed.composition,
                }
                if seed
                else None
            ),
            "alternatives": items,
        }
    )


@bp.get("/medicine/alternatives")
def alternatives():
    mid = request.args.get("id", type=int)
    name = request.args.get("name") or ""
    if not mid and not name:
        return jsonify({"error": "Provide id or name"}), 400
    nm = name
    comp = ""
    if mid:
        m = MedicineCatalog.query.get(mid)
        if m:
            nm = m.name
            comp = m.composition or ""
    return jsonify({"alternatives": suggest_alternatives(nm or "medicine", comp)})


_ALLOWED_BUY_HOSTS = (
    "1mg.com",
    "pharmeasy.in",
    "apollopharmacy.in",
    "netmeds.com",
    "truemeds.in",
    "medplusmart.com",
    "amazon.in",
    "flipkart.com",
)


@bp.get("/buy")
@jwt_required(optional=True)
def buy_redirect():
    """Track and redirect to pharmacy purchase URL (whitelist only)."""
    from urllib.parse import urlparse

    from flask import redirect

    raw = (request.args.get("url") or "").strip()
    if not raw:
        return err("url query param required", status=400)
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return err("Invalid URL", status=400)
    host = parsed.netloc.lower().removeprefix("www.")
    if not any(host == h or host.endswith("." + h) for h in _ALLOWED_BUY_HOSTS):
        return err("Pharmacy URL not allowed", status=400)
    return redirect(raw, code=302)

