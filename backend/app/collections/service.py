import uuid

from sqlmodel import Session

from app.collections.adapters import CollectionItemAdapter
from app.collections.exceptions import AlreadyInCollectionError
from app.collections.schemas import (
    CollectionItemCreate,
    CollectionItemDomain,
    CollectionItemUpdate,
)
from app.media import service as media_service
from app.media.providers.base import MediaProvider


async def add_item_to_collection(
    *,
    session: Session,
    adapter: CollectionItemAdapter,
    provider: MediaProvider,
    user_id: uuid.UUID,
    collection_name: str,
    item_in: CollectionItemCreate,
) -> CollectionItemDomain:
    # 1. Fetch from provider and ensure Media exists
    details = await provider.get_details(
        external_id=item_in.tmdb_id,
        media_type=item_in.media_type,
    )
    media = media_service.get_or_create_media(session=session, details=details)

    # 2. Check if already in collection
    existing = adapter.get_by_user_media_and_collection(
        user_id=user_id,
        media_id=media.id,
        collection_name=collection_name,
    )
    if existing:
        raise AlreadyInCollectionError(collection_name)

    # 3. Clean up generic combinations if needed
    if collection_name == "watched":
        watchlist_item = adapter.get_by_user_media_and_collection(
            user_id=user_id,
            media_id=media.id,
            collection_name="watchlist",
        )
        if watchlist_item:
            adapter.delete(id=watchlist_item.id)

    # 4. Save to DB
    return adapter.add(
        user_id=user_id,
        media_id=media.id,
        collection_name=collection_name,
        rating=item_in.rating,
    )


def update_collection_item(
    *,
    adapter: CollectionItemAdapter,
    item_id: uuid.UUID,
    item_in: CollectionItemUpdate,
) -> CollectionItemDomain | None:
    return adapter.update(id=item_id, rating=item_in.rating)


def get_collection_items(
    *,
    adapter: CollectionItemAdapter,
    user_id: uuid.UUID,
    collection_name: str,
    skip: int,
    limit: int,
) -> tuple[list[CollectionItemDomain], int]:
    return adapter.get_list(
        user_id=user_id, collection_name=collection_name, skip=skip, limit=limit
    )


def remove_collection_item(
    *,
    adapter: CollectionItemAdapter,
    item_id: uuid.UUID,
) -> bool:
    return adapter.delete(id=item_id)
