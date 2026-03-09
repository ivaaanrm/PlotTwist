from sqlmodel import SQLModel

from app.collections.schemas import CollectionItemPublic
from app.users.schemas import UserPublic


class FeedItem(SQLModel):
    user: UserPublic
    collection_item: CollectionItemPublic


class FeedPublic(SQLModel):
    data: list[FeedItem]
    count: int
