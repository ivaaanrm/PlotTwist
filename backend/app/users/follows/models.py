import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class FollowStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Follow(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("follower_id", "following_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    follower_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    following_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    status: FollowStatus = Field(default=FollowStatus.pending)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
