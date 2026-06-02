"""Affordability insights from live scraped rows only — no fabricated medicine names."""
from __future__ import annotations

from typing import Any


def affordability_score(unit_prices: list[float]) -> float | None:
    if not unit_prices:
        return None
    lo = min(unit_prices)
    hi = max(unit_prices) or lo
    if hi <= lo:
        return 1.0
    return round(1.0 - ((sum(unit_prices) / len(unit_prices) - lo) / (hi - lo + 1e-6)), 4)


def rank_pharmacies_by_unit_price(prices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Ranks real pharmacy offers by unit price when available, else by MRP.
    Does not invent substitute product names.
    """
    rows = []
    for i, row in enumerate(sorted(prices, key=lambda r: (r.get("unit_price") is None, r.get("unit_price") or r.get("price") or 0))):
        rows.append(
            {
                "rank": i + 1,
                "pharmacy_name": row.get("pharmacy_name"),
                "price": row.get("price"),
                "unit_price": row.get("unit_price"),
                "url": row.get("url"),
                "note": "Live listing from pharmacy search — verify pack size on site.",
            }
        )
    return rows


def affordability_insights(prices: list[dict[str, Any]]) -> dict[str, Any]:
    unit_vals = [float(x["unit_price"]) for x in prices if x.get("unit_price") is not None]
    mrp_vals = [float(x["price"]) for x in prices if x.get("price") is not None]
    return {
        "spread_ratio": affordability_score(unit_vals or mrp_vals),
        "lowest_mrp_pharmacy": min(prices, key=lambda r: float(r.get("price") or 1e12)).get("pharmacy_name")
        if prices
        else None,
    }


def suggest_alternatives(medicine_name: str, composition_hint: str | None = None) -> list[dict[str, Any]]:
    """Catalog matches by composition or generic name (same logic as /api/alternatives)."""
    from app.models.medicine import MedicineCatalog

    name = (medicine_name or "").strip()
    if not name:
        return []

    seed = MedicineCatalog.query.filter(MedicineCatalog.name.ilike(f"%{name}%")).first()
    composition = composition_hint or (seed.composition if seed else None)
    generic = seed.generic_name if seed else None
    items: list[dict[str, Any]] = []

    if composition:
        rows = (
            MedicineCatalog.query.filter(MedicineCatalog.composition.ilike(f"%{composition}%"))
            .limit(10)
            .all()
        )
        for r in rows:
            if seed and r.id == seed.id:
                continue
            items.append(
                {
                    "id": r.id,
                    "name": r.name,
                    "generic_name": r.generic_name,
                    "composition": r.composition,
                    "manufacturer": r.manufacturer,
                    "match_basis": "composition",
                }
            )
    if not items and generic:
        rows = (
            MedicineCatalog.query.filter(MedicineCatalog.generic_name.ilike(f"%{generic}%"))
            .limit(10)
            .all()
        )
        for r in rows:
            if seed and r.id == seed.id:
                continue
            items.append(
                {
                    "id": r.id,
                    "name": r.name,
                    "generic_name": r.generic_name,
                    "composition": r.composition,
                    "manufacturer": r.manufacturer,
                    "match_basis": "generic_name",
                }
            )
    return items
