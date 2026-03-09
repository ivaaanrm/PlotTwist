import uuid
from typing import Protocol, runtime_checkable

from sqlmodel import Session, col, func, select

from app.collections.models import CollectionItem
from app.collections.schemas import CollectionItemDomain


@runtime_checkable
class CollectionItemAdapter(Protocol):
    def add(
        self,
        user_id: uuid.UUID,
        media_id: uuid.UUID,
        collection_name: str,
        rating: float | None,
    ) -> CollectionItemDomain: ...
    def get_by_user_media_and_collection(
        self, user_id: uuid.UUID, media_id: uuid.UUID, collection_name: str
    ) -> CollectionItemDomain | None: ...
    def get_list(
        self, user_id: uuid.UUID, collection_name: str, skip: int, limit: int
    ) -> tuple[list[CollectionItemDomain], int]: ...
    def update(
        self, id: uuid.UUID, rating: float | None
    ) -> CollectionItemDomain | None: ...
    def delete(self, id: uuid.UUID) -> bool: ...
    def get_by_id(self, id: uuid.UUID) -> CollectionItemDomain | None: ...


class SqlCollectionAdapter(CollectionItemAdapter):
    def __init__(self, session: Session):
        self._session = session

    def add(
        self,
        user_id: uuid.UUID,
        media_id: uuid.UUID,
        collection_name: str,
        rating: float | None,
    ) -> CollectionItemDomain:
        schema = CollectionItem(
            user_id=user_id,
            media_id=media_id,
            collection_name=collection_name,
            rating=rating,
        )
        self._session.add(schema)
        self._session.commit()
        self._session.refresh(schema)
        return CollectionItemDomain.model_validate(schema)

    def get_by_user_media_and_collection(
        self, user_id: uuid.UUID, media_id: uuid.UUID, collection_name: str
    ) -> CollectionItemDomain | None:
        stmt = select(CollectionItem).where(
            CollectionItem.user_id == user_id,
            CollectionItem.media_id == media_id,
            CollectionItem.collection_name == collection_name,
        )
        schema = self._session.exec(stmt).first()
        if not schema:
            return None
        return CollectionItemDomain.model_validate(schema)

    def get_list(
        self, user_id: uuid.UUID, collection_name: str, skip: int, limit: int
    ) -> tuple[list[CollectionItemDomain], int]:
        count_stmt = (
            select(func.count())
            .select_from(CollectionItem)
            .where(
                CollectionItem.user_id == user_id,
                CollectionItem.collection_name == collection_name,
            )
        )
        count = self._session.exec(count_stmt).one()

        stmt = (
            select(CollectionItem)
            .where(
                CollectionItem.user_id == user_id,
                CollectionItem.collection_name == collection_name,
            )
            .order_by(col(CollectionItem.created_at).desc())
            .offset(skip)
            .limit(limit)
        )
        schemas = self._session.exec(stmt).all()
        return [CollectionItemDomain.model_validate(s) for s in schemas], count

    def get_by_id(self, id: uuid.UUID) -> CollectionItemDomain | None:
        schema = self._session.get(CollectionItem, id)
        if not schema:
            return None
        return CollectionItemDomain.model_validate(schema)

    def update(
        self, id: uuid.UUID, rating: float | None
    ) -> CollectionItemDomain | None:
        schema = self._session.get(CollectionItem, id)
        if schema:
            if rating is not None:
                schema.rating = rating
            self._session.add(schema)
            self._session.commit()
            self._session.refresh(schema)
            return CollectionItemDomain.model_validate(schema)
        return None

    def delete(self, id: uuid.UUID) -> bool:
        schema = self._session.get(CollectionItem, id)
        if schema:
            self._session.delete(schema)
            self._session.commit()
            return True
        return False
