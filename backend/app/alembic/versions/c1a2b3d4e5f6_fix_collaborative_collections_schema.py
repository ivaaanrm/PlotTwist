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
    # --- collection table: add owner_id, is_collaborative, updated_at ---

    # Add owner_id as nullable first (existing rows need a value)
    op.add_column(
        "collection",
        sa.Column("owner_id", sa.Uuid(), nullable=True),
    )

    # Backfill existing rows: assign first user as owner
    op.execute(
        """
        UPDATE collection
        SET owner_id = (SELECT id FROM "user" ORDER BY id LIMIT 1)
        WHERE owner_id IS NULL
        """
    )

    # Now make it NOT NULL
    op.alter_column("collection", "owner_id", nullable=False)

    # Add FK constraint
    op.create_foreign_key(
        "fk_collection_owner_id",
        "collection",
        "user",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.add_column(
        "collection",
        sa.Column(
            "is_collaborative",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "collection",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- collection_item table: add position ---
    op.add_column(
        "collection_item",
        sa.Column(
            "position",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    # --- collection_invitation: add unique constraint ---
    op.create_unique_constraint(
        "uq_invitation_collection_receiver",
        "collection_invitation",
        ["collection_id", "receiver_id"],
    )


def downgrade():
    op.drop_constraint(
        "uq_invitation_collection_receiver",
        "collection_invitation",
        type_="unique",
    )

    op.drop_column("collection_item", "position")

    op.drop_column("collection", "updated_at")
    op.drop_column("collection", "is_collaborative")

    op.drop_constraint("fk_collection_owner_id", "collection", type_="foreignkey")
    op.drop_column("collection", "owner_id")
