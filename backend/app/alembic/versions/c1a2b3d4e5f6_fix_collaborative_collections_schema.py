"""Fix collaborative collections schema - add missing columns

Revision ID: c1a2b3d4e5f6
Revises: b969536c333a
Create Date: 2026-03-09 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c1a2b3d4e5f6"
down_revision = "b969536c333a"
branch_labels = None
depends_on = None


def upgrade():
    # No-op: all columns and constraints are already created in migration
    # b969536c333a (add_collaborative_collections).
    pass


def downgrade():
    pass
