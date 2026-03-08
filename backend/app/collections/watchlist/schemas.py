import uuid
from datetime import datetime

from sqlmodel import SQLModel

from app.media.models import MediaType
from app.media.schemas import MediaPublic


class WatchlistItemCreate(SQLModel):
    tmdb_id: int
    media_type: MediaType = MediaType.movie


class WatchlistItemPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    media_id: uuid.UUID
    added_at: datetime | None = None
    media: MediaPublic | None = None


class WatchlistItemsPublic(SQLModel):
    data: list[WatchlistItemPublic]
    count: int


class Message(SQLModel):
    message: str


__all__ = [
    "Message",
    "WatchlistItemCreate",
    "WatchlistItemPublic",
    "WatchlistItemsPublic",
]

