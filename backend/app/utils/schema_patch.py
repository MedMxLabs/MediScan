"""Bring existing DBs up to the ORM schema (create_all() only creates missing tables).

Production Postgres predates Alembic, so additive changes are applied here idempotently;
the matching Alembic revisions keep fresh migration-managed DBs in sync.
"""
from __future__ import annotations

import logging

from sqlalchemy import inspect, text

logger = logging.getLogger(__name__)

# Columns on User that may be missing on older medscan.db files
_SQLITE_USER_ALTER: list[tuple[str, str]] = [
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

# (index name, table, columns, unique) — names match SQLAlchemy's index=True convention.
INDEXES: list[tuple[str, str, tuple[str, ...], bool]] = [
    ("ix_users_supabase_id", "users", ("supabase_id",), True),
    ("ix_search_history_user_id", "search_history", ("user_id",), False),
    ("ix_prescriptions_user_id", "prescriptions", ("user_id",), False),
    ("ix_lab_reports_user_id", "lab_reports", ("user_id",), False),
    ("ix_reminders_user_id", "reminders", ("user_id",), False),
    ("ix_reminders_status_next_trigger", "reminders", ("status", "next_trigger"), False),
    ("ix_adherence_logs_user_id_taken_at", "adherence_logs", ("user_id", "taken_at"), False),
    ("ix_search_cache_query_bucket", "search_cache", ("normalized_query", "date_bucket"), False),
]


def _execute(db, stmt: str, label: str) -> None:
    try:
        with db.engine.begin() as conn:
            conn.execute(text(stmt))
        logger.info("schema patch: %s", label)
    except Exception as exc:
        logger.warning("schema patch %s failed: %s", label, exc)


def _patch_columns(db, insp) -> None:
    dialect = db.engine.dialect.name
    cols = {c["name"] for c in insp.get_columns("users")}
    if dialect == "sqlite":
        for col, ddl in _SQLITE_USER_ALTER:
            if col not in cols:
                _execute(db, f"ALTER TABLE users ADD COLUMN {col} {ddl}", f"users.{col}")
    elif dialect == "postgresql" and "supabase_id" not in cols:
        _execute(db, "ALTER TABLE users ADD COLUMN supabase_id VARCHAR(36)", "users.supabase_id")


def _patch_indexes(db, insp) -> None:
    tables = set(insp.get_table_names())
    for name, table, columns, unique in INDEXES:
        if table not in tables:
            continue
        if name in {i["name"] for i in insp.get_indexes(table)}:
            continue
        kind = "UNIQUE INDEX" if unique else "INDEX"
        _execute(
            db,
            f"CREATE {kind} IF NOT EXISTS {name} ON {table} ({', '.join(columns)})",
            name,
        )


def patch_schema(db) -> None:
    if db.engine.dialect.name not in ("sqlite", "postgresql"):
        return
    insp = inspect(db.engine)
    if not insp.has_table("users"):
        return
    _patch_columns(db, insp)
    _patch_indexes(db, insp)
