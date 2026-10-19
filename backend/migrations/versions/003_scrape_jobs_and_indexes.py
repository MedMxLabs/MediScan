"""Add scrape_jobs table and hot-path indexes; drop unused price_cache."""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from app.utils.schema_patch import INDEXES

revision = "003_scrape_jobs"
down_revision = "002_supabase_id"
branch_labels = None
depends_on = None


def _index_names(insp, table: str) -> set[str]:
    return {i["name"] for i in insp.get_indexes(table)}


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())
    if "scrape_jobs" not in tables:
        op.create_table(
            "scrape_jobs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("normalized_query", sa.String(512), nullable=False),
            sa.Column("date_bucket", sa.String(10), nullable=False),
            sa.Column("state", sa.String(16), nullable=False),
            sa.Column("error", sa.String(512), nullable=True),
            sa.Column("scrape_errors", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_scrape_jobs_normalized_query", "scrape_jobs", ["normalized_query"])
    for name, table, columns, unique in INDEXES:
        if table in tables and name not in _index_names(insp, table):
            op.create_index(name, table, list(columns), unique=unique)
    if "price_cache" in tables:
        op.drop_table("price_cache")


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())
    for name, table, _cols, _unique in INDEXES:
        # 002 owns the supabase_id index.
        if name != "ix_users_supabase_id" and table in tables and name in _index_names(insp, table):
            op.drop_index(name, table_name=table)
    if "scrape_jobs" in tables:
        op.drop_table("scrape_jobs")
