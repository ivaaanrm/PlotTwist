import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.media.models import Media
    from app.users.models import User


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class CollectionItem(SQLModel, table=True):
    __tablename__ = "collection_item"
    __table_args__ = (UniqueConstraint("user_id", "media_id", "collection_name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    media_id: uuid.UUID = Field(
        foreign_key="media.id", nullable=False, ondelete="CASCADE"
    )
    collection_name: str = Field(nullable=False, index=True)
    rating: float | None = Field(default=None, ge=0.5, le=5.0)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user: "User" = Relationship(back_populates="collection_items")
    media: "Media" = Relationship()


__all__ = ["CollectionItem", "get_datetime_utc"]
