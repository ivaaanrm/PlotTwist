import uuid
from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.media.models import MediaType
from app.media.schemas import MediaPublic


class WatchedMediaBase(SQLModel):
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError(
                "Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)"
            )
        return v


class WatchedMediaCreate(SQLModel):
    tmdb_id: int
    media_type: MediaType = MediaType.movie
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError(
                "Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)"
            )
        return v


class WatchedMediaUpdate(SQLModel):
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError(
                "Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)"
            )
        return v


class WatchedMediaPublic(WatchedMediaBase):
    id: uuid.UUID
    user_id: uuid.UUID
    media_id: uuid.UUID
    watched_at: datetime | None = None
    media: MediaPublic | None = None


WatchedMoviePublic = WatchedMediaPublic


class WatchedMediaListPublic(SQLModel):
    data: list[WatchedMediaPublic]
    count: int


class Message(SQLModel):
    message: str


__all__ = [
    "Message",
    "WatchedMediaCreate",
    "WatchedMediaListPublic",
    "WatchedMediaPublic",
    "WatchedMediaUpdate",
    "WatchedMoviePublic",
]

