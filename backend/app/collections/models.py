import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.media.models import Media
    from app.users.models import User


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# --- Enums ---


class CollectionRole(str, Enum):
    owner = "owner"
    editor = "editor"


class InvitationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


# --- Named Collection ---


class Collection(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, index=True)
    description: str | None = Field(default=None)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    is_collaborative: bool = Field(default=False)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    owner: "User" = Relationship()
    members: list["CollectionMember"] = Relationship(
        back_populates="collection", cascade_delete=True
    )
    items: list["CollectionItem"] = Relationship(
        back_populates="collection",
        cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "[CollectionItem.collection_id]"},
    )
    invitations: list["CollectionInvitation"] = Relationship(
        back_populates="collection", cascade_delete=True
    )


class CollectionMember(SQLModel, table=True):
    __tablename__ = "collection_member"
    __table_args__ = (UniqueConstraint("collection_id", "user_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    collection_id: uuid.UUID = Field(
        foreign_key="collection.id", nullable=False, ondelete="CASCADE"
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    role: CollectionRole = Field(default=CollectionRole.editor)
    joined_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    collection: Collection = Relationship(back_populates="members")
    user: "User" = Relationship()


class CollectionInvitation(SQLModel, table=True):
    __tablename__ = "collection_invitation"
    __table_args__ = (UniqueConstraint("collection_id", "receiver_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    collection_id: uuid.UUID = Field(
        foreign_key="collection.id", nullable=False, ondelete="CASCADE"
    )
    sender_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    receiver_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    status: InvitationStatus = Field(default=InvitationStatus.pending)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    collection: Collection = Relationship(back_populates="invitations")
    sender: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[CollectionInvitation.sender_id]"}
    )
    receiver: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[CollectionInvitation.receiver_id]"}
    )


# --- Collection Item (personal + named) ---


class CollectionItem(SQLModel, table=True):
    __tablename__ = "collection_item"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "media_id", "collection_name", "collection_id",
            name="uq_user_media_collection",
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    media_id: uuid.UUID = Field(
        foreign_key="media.id", nullable=False, ondelete="CASCADE"
    )
    collection_name: str | None = Field(default=None, index=True)
    collection_id: uuid.UUID | None = Field(
        default=None, foreign_key="collection.id", ondelete="CASCADE"
    )
    rating: float | None = Field(default=None, ge=0.5, le=5.0)
    position: int = Field(default=0)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    user: "User" = Relationship(back_populates="collection_items")
    media: "Media" = Relationship()
    collection: Collection | None = Relationship(back_populates="items")


__all__ = [
    "Collection",
    "CollectionItem",
    "CollectionInvitation",
    "CollectionMember",
    "CollectionRole",
    "InvitationStatus",
    "get_datetime_utc",
]
