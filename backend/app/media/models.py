import uuid
from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class MediaType(str, Enum):
    movie = "movie"
    series = "series"


class Media(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("tmdb_id", "media_type"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tmdb_id: int = Field(index=True)
    media_type: MediaType
    title: str = Field(max_length=255)
    overview: str | None = Field(default=None, max_length=2000)
    poster_path: str | None = Field(default=None, max_length=255)
    backdrop_path: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    tmdb_rating: float | None = None
    genres: str | None = Field(default=None, max_length=500)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
