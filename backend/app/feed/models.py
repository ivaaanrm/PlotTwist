from sqlmodel import SQLModel

from app.collections.watched.schemas import WatchedMediaPublic
from app.users.schemas import UserPublic


class FeedItem(SQLModel):
    user: UserPublic
    watched_media: WatchedMediaPublic


class FeedPublic(SQLModel):
    data: list[FeedItem]
    count: int
