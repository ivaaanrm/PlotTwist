import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.media.models import MediaType
from app.media.schemas import MediaPublic


class CollectionItemDomain(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    media_id: uuid.UUID
    collection_name: str
    rating: float | None = Field(default=None, ge=0.5, le=5.0)
    created_at: datetime | None = None
    media: MediaPublic | None = None


class CollectionItemCreate(BaseModel):
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


class CollectionItemUpdate(BaseModel):
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError(
                "Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)"
            )
        return v


CollectionItemPublic = CollectionItemDomain


class CollectionItemListPublic(BaseModel):
    data: list[CollectionItemPublic]
    count: int


class Message(BaseModel):
    message: str


__all__ = [
    "Message",
    "CollectionItemCreate",
    "CollectionItemDomain",
    "CollectionItemListPublic",
    "CollectionItemPublic",
    "CollectionItemUpdate",
]
