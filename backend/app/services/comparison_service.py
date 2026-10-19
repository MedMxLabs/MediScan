"""Medicine search and comparison — Redis, DB cache, background Playwright scraping."""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

from app.extensions import db
from app.models.medicine import SearchCache
from app.models.price import Price
from app.models.search_history import SearchHistory
from app.services.recommendation_service import affordability_insights, rank_pharmacies_by_unit_price
from app.utils.redis_cache import cache_key_search, delete_cache_key, get_cache, set_cache
from app.utils.validators import normalize_medicine_query

logger = logging.getLogger(__name__)

PENDING = 202


def _today_bucket() -> str:
    return date.today().isoformat()


def _payload_from_outcome(normalized: str, outcome) -> dict[str, Any]:
    md = outcome.prices[0].get("medicine_display") if outcome.prices else normalized.title()
    return {
        "query": normalized,
        "medicine_display": md or normalized.title(),
        "prices": outcome.prices,
        "scrape_errors": outcome.errors,
        "alternatives": rank_pharmacies_by_unit_price(outcome.prices),
        "affordability": affordability_insights(outcome.prices),
        "scrape_timestamp": datetime.utcnow().isoformat() + "Z",
    }


def _persist_price_snapshots(normalized: str, prices: list[dict[str, Any]]) -> None:
    for row in prices:
        db.session.add(
            Price(
                normalized_query=normalized,
                pharmacy_name=row.get("pharmacy_name") or "",
                medicine_display=row.get("medicine_display"),
                pack_size=row.get("pack_size"),
                price=float(row.get("price") or 0),
                unit_price=row.get("unit_price"),
                discount=row.get("discount"),
                availability=row.get("availability"),
                url=(row.get("url") or "")[:1024],
            )
        )


def _record_history(user_id: int, normalized: str, prices: list[dict[str, Any]]) -> None:
    try:
        cheapest = prices[0] if prices else None
        summary = {
            "cheapest": cheapest,
            "medicine_display": (cheapest or {}).get("medicine_display") or normalized,
            "pharmacies": len(prices),
        }
        db.session.add(SearchHistory(user_id=user_id, query=normalized, summary_json=summary))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.warning("SearchHistory persist failed (non-fatal): %s", exc)


def store_scrape_result(
    normalized: str,
    bucket: str,
    outcome,
    *,
    user_id: int | None,
    persist_snapshots: bool = True,
) -> dict[str, Any]:
    """Cache a successful scrape (DB + Redis) and record history; returns the payload."""
    payload = _payload_from_outcome(normalized, outcome)
    db.session.add(SearchCache(normalized_query=normalized, date_bucket=bucket, payload_json=payload))
    if persist_snapshots:
        _persist_price_snapshots(normalized, outcome.prices)
    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        logger.warning("Cache/price persist failed (non-fatal): %s", exc)
    set_cache(cache_key_search(normalized, bucket), payload)
    if user_id is not None:
        _record_history(user_id, normalized, outcome.prices)
    return {**payload, "cache_hit": False}


def _clear_cached(normalized: str, bucket: str, redis_key: str) -> None:
    delete_cache_key(redis_key)
    SearchCache.query.filter_by(normalized_query=normalized, date_bucket=bucket).delete(synchronize_session=False)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()


def _cached_payload(normalized: str, bucket: str, redis_key: str) -> dict[str, Any] | None:
    cached = get_cache(redis_key)
    if cached:
        return {**cached, "cache_hit": True}
    row = (
        SearchCache.query.filter_by(normalized_query=normalized, date_bucket=bucket)
        .order_by(SearchCache.created_at.desc())
        .first()
    )
    if not row:
        return None
    payload = dict(row.payload_json)
    payload.pop("cache_hit", None)
    set_cache(redis_key, payload)
    return {**payload, "cache_hit": True}


def search_medicine(
    raw_query: str,
    *,
    user_id: int | None,
    persist_snapshots: bool = True,
    force_refresh: bool = False,
    wait: bool = False,
) -> tuple[dict[str, Any] | None, int | None, str | None]:
    """
    Returns (payload, http_status_or_None, error_message_or_None).

    On a cache miss a background scrape job is started and (pending_payload, 202, None) is
    returned; clients poll /api/scrape-jobs/<id> then repeat the request. Pass wait=True to
    scrape inline (scheduler jobs). Inline failure returns (detail, 502, message).
    """
    normalized = normalize_medicine_query(raw_query)
    if not normalized:
        return None, 400, "Missing or invalid query"

    bucket = _today_bucket()
    redis_key = cache_key_search(normalized, bucket)
    if force_refresh:
        _clear_cached(normalized, bucket, redis_key)
    else:
        cached = _cached_payload(normalized, bucket, redis_key)
        if cached:
            return cached, None, None

    if not wait:
        from app.services.scrape_job_service import enqueue_scrape, pending_payload

        return pending_payload(enqueue_scrape(normalized, bucket, user_id)), PENDING, None

    from app.services.scrape_job_service import NO_PRICES_MSG
    from app.services.scraper_service import run_live_scrape

    outcome = run_live_scrape(normalized)
    if not outcome.prices:
        return {"failed_all": True, "query": normalized, "scrape_errors": outcome.errors}, 502, NO_PRICES_MSG
    return store_scrape_result(normalized, bucket, outcome, user_id=user_id, persist_snapshots=persist_snapshots), None, None


def compare_medicine(
    medicine_query: str,
    user_id: int | None,
    *,
    force_refresh: bool = False,
) -> tuple[dict[str, Any] | None, int | None, str | None]:
    """Same pipeline as search; response geared for comparison UI (ranking + savings)."""
    payload, code, msg = search_medicine(medicine_query, user_id=user_id, force_refresh=force_refresh)
    if code or not payload:
        return payload, code, msg
    prices = payload.get("prices") or []
    if not prices:
        return payload, 502, "No prices"
    sorted_prices = sorted(prices, key=lambda r: float(r.get("price") or 0))
    lowest = float(sorted_prices[0].get("price") or 0)
    enriched = []
    for row in sorted_prices:
        p = float(row.get("price") or 0)
        savings_pct = round(100.0 * (p - lowest) / p, 1) if lowest > 0 and p > lowest else None
        enriched.append({**row, "savings_percent_vs_lowest": savings_pct})
    return (
        {
            **payload,
            "prices": enriched,
            "lowest_price": lowest,
            "comparison_ranking": [r.get("pharmacy_name") for r in sorted_prices],
        },
        None,
        None,
    )
