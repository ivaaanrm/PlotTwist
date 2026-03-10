import uuid
from datetime import datetime

from sqlmodel import SQLModel

from app.users.follows.models import FollowStatus
from app.users.schemas import UserPublic


class FollowUpdate(SQLModel):
    status: FollowStatus


class FollowPublic(SQLModel):
    id: uuid.UUID
    follower_id: uuid.UUID
    following_id: uuid.UUID
    status: FollowStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FollowsPublic(SQLModel):
    data: list[FollowPublic]
    count: int


class FollowWithUserPublic(FollowPublic):
    user: UserPublic


class FollowsWithUsersPublic(SQLModel):
    data: list[FollowWithUserPublic]
    count: int


class FollowRequestPublic(SQLModel):
    follow: FollowPublic
    requester: UserPublic


class FollowRequestsPublic(SQLModel):
    data: list[FollowRequestPublic]
    count: int


class Message(SQLModel):
    message: str


__all__ = [
    "FollowPublic",
    "FollowRequestPublic",
    "FollowRequestsPublic",
    "FollowsPublic",
    "FollowStatus",
    "FollowUpdate",
    "FollowWithUserPublic",
    "FollowsWithUsersPublic",
    "Message",
    "UserPublic",
]
