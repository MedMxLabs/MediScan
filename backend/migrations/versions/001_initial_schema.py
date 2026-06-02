"""Initial schema snapshot for Alembic migrations."""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("google_id", sa.String(255)),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255)),
        sa.Column("phone", sa.String(32)),
        sa.Column("date_of_birth", sa.String(16)),
        sa.Column("gender", sa.String(16)),
        sa.Column("preferences", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.create_table(
        "medicine_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("generic_name", sa.String(512)),
        sa.Column("composition", sa.String(1024)),
        sa.Column("strength", sa.String(128)),
        sa.Column("form", sa.String(64)),
        sa.Column("manufacturer", sa.String(255)),
    )
    op.create_index("ix_medicine_catalog_name", "medicine_catalog", ["name"])

    op.create_table(
        "reminders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("medicine_name", sa.String(512), nullable=False),
        sa.Column("dose", sa.String(128)),
        sa.Column("schedule", sa.JSON()),
        sa.Column("frequency", sa.String(64)),
        sa.Column("duration_days", sa.Integer()),
        sa.Column("status", sa.String(32)),
        sa.Column("next_trigger", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "adherence_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reminder_id", sa.Integer(), sa.ForeignKey("reminders.id"), nullable=False),
        sa.Column("taken_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("adherence_logs")
    op.drop_table("reminders")
    op.drop_index("ix_medicine_catalog_name", "medicine_catalog")
    op.drop_table("medicine_catalog")
    op.drop_index("ix_users_google_id", "users")
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
