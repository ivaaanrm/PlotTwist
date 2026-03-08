from sqlmodel import SQLModel

from app.users.schemas import UserPublic
from app.watched.schemas import WatchedMediaPublic


class FeedItem(SQLModel):
    user: UserPublic
    watched_media: WatchedMediaPublic


class FeedPublic(SQLModel):
    data: list[FeedItem]
    count: int
