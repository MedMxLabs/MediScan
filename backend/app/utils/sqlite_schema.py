"""SQLite: add ORM columns that are missing on existing DBs (create_all() only creates new tables)."""
from __future__ import annotations

import logging

from sqlalchemy import inspect, text

logger = logging.getLogger(__name__)

# Columns on User that may be missing on older medscan.db files
_USER_ALTER: list[tuple[str, str]] = [
    ("supabase_id", "VARCHAR(36)"),
    ("name", "VARCHAR(255)"),
    ("phone", "VARCHAR(32)"),
    ("date_of_birth", "VARCHAR(16)"),
    ("gender", "VARCHAR(16)"),
    ("preferences", "TEXT"),
    (
        "created_at",
        "DATETIME DEFAULT (datetime('now'))",  # backfill existing rows
    ),
]


def _ensure_supabase_id(db, insp) -> None:
    cols = {c["name"] for c in insp.get_columns("users")}
    if "supabase_id" in cols:
        return
    ddl = "VARCHAR(36)"
    try:
        with db.engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN supabase_id {ddl}"))
        indexes = {i["name"] for i in insp.get_indexes("users")}
        if "ix_users_supabase_id" not in indexes:
            with db.engine.begin() as conn:
                conn.execute(text("CREATE UNIQUE INDEX ix_users_supabase_id ON users (supabase_id)"))
        logger.info("%s migrated users.supabase_id", db.engine.dialect.name)
    except Exception as exc:
        logger.warning("%s migrate users.supabase_id failed: %s", db.engine.dialect.name, exc)


def patch_sqlite_users_columns(db) -> None:
    insp = inspect(db.engine)
    if not insp.has_table("users"):
        return
    if db.engine.dialect.name == "postgresql":
        _ensure_supabase_id(db, insp)
        return
    if db.engine.dialect.name != "sqlite":
        return
    for col, ddl in _USER_ALTER:
        cols = {c["name"] for c in insp.get_columns("users")}
        if col in cols:
            continue
        stmt = f"ALTER TABLE users ADD COLUMN {col} {ddl}"
        try:
            with db.engine.begin() as conn:
                conn.execute(text(stmt))
            logger.info("sqlite migrated users.%s", col)
        except Exception as exc:
            logger.warning("sqlite migrate users.%s failed: %s", col, exc)
