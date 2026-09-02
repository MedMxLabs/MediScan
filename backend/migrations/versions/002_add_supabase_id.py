"""Add users.supabase_id for Supabase Auth linking."""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "002_supabase_id"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c["name"] for c in insp.get_columns("users")}
    if "supabase_id" not in cols:
        op.add_column("users", sa.Column("supabase_id", sa.String(36), nullable=True))
    indexes = {i["name"] for i in insp.get_indexes("users")}
    if "ix_users_supabase_id" not in indexes:
        op.create_index("ix_users_supabase_id", "users", ["supabase_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    indexes = {i["name"] for i in insp.get_indexes("users")}
    if "ix_users_supabase_id" in indexes:
        op.drop_index("ix_users_supabase_id", table_name="users")
    cols = {c["name"] for c in insp.get_columns("users")}
    if "supabase_id" in cols:
        op.drop_column("users", "supabase_id")
