import uuid
from datetime import date, datetime

from pydantic import BaseModel
from sqlmodel import Field, SQLModel

from app.media.models import MediaType


class MediaSearchResult(BaseModel):
    external_id: int
    media_type: MediaType
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MediaDetails(BaseModel):
    external_id: int
    media_type: MediaType
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MediaSearchResponse(BaseModel):
    results: list[MediaSearchResult]
    page: int
    total_pages: int
    total_results: int


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

__all__ = [
    "MediaPublic",
    "MediaSearchResponse",
    "MediaType",
    "MoviePublic",
    "MediaSearchResult",
    "MediaDetails",
]
