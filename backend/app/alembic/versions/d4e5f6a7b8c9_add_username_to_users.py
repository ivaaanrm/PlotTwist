"""add_username_to_users

Revision ID: d4e5f6a7b8c9
Revises: c1a2b3d4e5f6
Create Date: 2026-03-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c1a2b3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: add nullable column
    op.add_column("user", sa.Column("username", sa.String(30), nullable=True))

    # Step 2: backfill existing users with user_<first 8 hex chars of id>
    op.execute(
        "UPDATE \"user\" SET username = 'user_' || substring(id::text, 1, 8)"
    )

    # Step 3: make NOT NULL, add unique constraint and index
    op.alter_column("user", "username", nullable=False)
    op.create_unique_constraint("uq_user_username", "user", ["username"])
    op.create_index("ix_user_username", "user", ["username"], unique=True)


def downgrade():
    op.drop_index("ix_user_username", table_name="user")
    op.drop_constraint("uq_user_username", "user", type_="unique")
    op.drop_column("user", "username")
