"""Seed MedicineCatalog from bundled JSON when the table is empty."""
from __future__ import annotations

import json
import logging
import os

from app.extensions import db
from app.models.medicine import MedicineCatalog

logger = logging.getLogger(__name__)

_SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "medicine_catalog_seed.json")


def seed_medicine_catalog_if_empty() -> int:
    """Insert seed rows when catalog is empty. Returns number of rows inserted."""
    if MedicineCatalog.query.count() > 0:
        return 0
    try:
        with open(_SEED_PATH, encoding="utf-8") as fp:
            rows = json.load(fp)
    except Exception as exc:
        logger.warning("medicine catalog seed file missing or invalid: %s", exc)
        return 0

    inserted = 0
    for row in rows:
        if not isinstance(row, dict) or not row.get("name"):
            continue
        db.session.add(
            MedicineCatalog(
                name=str(row["name"]).strip(),
                generic_name=(row.get("generic_name") or "").strip() or None,
                composition=(row.get("composition") or "").strip() or None,
                strength=(row.get("strength") or "").strip() or None,
                form=(row.get("form") or "").strip() or None,
                manufacturer=(row.get("manufacturer") or "").strip() or None,
            )
        )
        inserted += 1
    if inserted:
        db.session.commit()
        logger.info("Seeded %d medicine catalog entries", inserted)
    return inserted
