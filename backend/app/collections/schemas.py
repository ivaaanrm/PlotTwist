import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.media.models import MediaType
from app.media.schemas import MediaPublic


# --- Collection Item (personal lists) ---


class CollectionItemDomain(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    media_id: uuid.UUID
    collection_name: str | None = None
    collection_id: uuid.UUID | None = None
    rating: float | None = Field(default=None, ge=0.5, le=5.0)
    position: int = 0
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


# --- Named Collection ---


class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    is_collaborative: bool = False


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_collaborative: bool | None = None


class CollectionMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    joined_at: datetime | None = None
    user_full_name: str | None = None
    user_email: str | None = None


class CollectionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None
    owner_id: uuid.UUID
    is_collaborative: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    item_count: int = 0
    members: list[CollectionMemberPublic] = []
    cover_posters: list[str | None] = []


class CollectionListPublic(BaseModel):
    data: list[CollectionPublic]
    count: int


class CollectionDetailPublic(CollectionPublic):
    items: list[CollectionItemPublic] = []


# --- Invitations ---


class CollectionInvitationCreate(BaseModel):
    receiver_id: uuid.UUID


class CollectionInvitationUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|declined)$")


class CollectionInvitationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    collection_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    status: str
    created_at: datetime | None = None
    collection_name: str | None = None
    sender_full_name: str | None = None


class CollectionInvitationListPublic(BaseModel):
    data: list[CollectionInvitationPublic]
    count: int


# --- Reorder ---


class ReorderRequest(BaseModel):
    item_ids: list[uuid.UUID]


class Message(BaseModel):
    message: str


__all__ = [
    "CollectionCreate",
    "CollectionDetailPublic",
    "CollectionInvitationCreate",
    "CollectionInvitationListPublic",
    "CollectionInvitationPublic",
    "CollectionInvitationUpdate",
    "CollectionItemCreate",
    "CollectionItemDomain",
    "CollectionItemListPublic",
    "CollectionItemPublic",
    "CollectionItemUpdate",
    "CollectionListPublic",
    "CollectionMemberPublic",
    "CollectionPublic",
    "CollectionUpdate",
    "Message",
    "ReorderRequest",
]
