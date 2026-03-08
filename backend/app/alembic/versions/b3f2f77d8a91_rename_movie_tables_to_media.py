"""Rename movie tables to media and align columns

Revision ID: b3f2f77d8a91
Revises: 4affa3026950
Create Date: 2026-03-08 16:05:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b3f2f77d8a91"
down_revision = "4affa3026950"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # movie -> media
    op.rename_table("movie", "media")

    media_type_enum = sa.Enum("movie", "series", name="mediatype")
    media_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "media",
        sa.Column(
            "media_type",
            media_type_enum,
            nullable=False,
            server_default="movie",
        ),
    )
    op.execute("ALTER TABLE media ALTER COLUMN media_type DROP DEFAULT")

    # old schema had unique tmdb index for movies only; new schema supports movie/series
    op.execute("DROP INDEX IF EXISTS ix_movie_tmdb_id")
    op.create_index(op.f("ix_media_tmdb_id"), "media", ["tmdb_id"], unique=False)
    op.create_unique_constraint(
        "uq_media_tmdb_id_media_type",
        "media",
        ["tmdb_id", "media_type"],
    )

    # watchedmovie -> watchedmedia and movie_id -> media_id
    op.rename_table("watchedmovie", "watchedmedia")
    op.alter_column("watchedmedia", "movie_id", new_column_name="media_id")

    # watchlist keeps table name, but column aligns with domain model
    op.alter_column("watchlistitem", "movie_id", new_column_name="media_id")


def downgrade() -> None:
    op.alter_column("watchlistitem", "media_id", new_column_name="movie_id")
    op.alter_column("watchedmedia", "media_id", new_column_name="movie_id")
    op.rename_table("watchedmedia", "watchedmovie")

    op.drop_constraint("uq_media_tmdb_id_media_type", "media", type_="unique")
    op.drop_index(op.f("ix_media_tmdb_id"), table_name="media")
    op.create_index("ix_movie_tmdb_id", "media", ["tmdb_id"], unique=True)

    op.drop_column("media", "media_type")
    op.rename_table("media", "movie")

    # Safe cleanup if type is no longer referenced.
    op.execute("DROP TYPE IF EXISTS mediatype")
