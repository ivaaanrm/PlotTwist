import uuid
from datetime import date, datetime

from sqlmodel import Field, SQLModel

from app.media.models import MediaType
from app.media.provider import MediaSearchResponse


class MediaBase(SQLModel):
    tmdb_id: int
    media_type: MediaType
    title: str = Field(max_length=255)
    overview: str | None = Field(default=None, max_length=2000)
    poster_path: str | None = Field(default=None, max_length=255)
    backdrop_path: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    tmdb_rating: float | None = None
    genres: str | None = Field(default=None, max_length=500)


class MediaPublic(MediaBase):
    id: uuid.UUID
    created_at: datetime | None = None


MoviePublic = MediaPublic

__all__ = ["MediaPublic", "MediaSearchResponse", "MediaType", "MoviePublic"]
