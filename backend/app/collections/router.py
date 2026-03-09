from typing import Any

from fastapi import APIRouter, Path

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections import dependencies as collections_deps
from app.collections import service as collections_service
from app.collections.schemas import (
    CollectionItemCreate,
    CollectionItemListPublic,
    CollectionItemPublic,
    CollectionItemUpdate,
    Message,
)
from app.media.dependencies import MediaProviderDep

router = APIRouter(prefix="/collections", tags=["collections"])


@router.post("/{collection_name}", response_model=CollectionItemPublic)
async def add_to_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MediaProviderDep,
    adapter: collections_deps.CollectionAdapterDep,
    collection_name: str = Path(...),
    item_in: CollectionItemCreate,
) -> Any:
    item = await collections_service.add_item_to_collection(
        session=session,
        adapter=adapter,
        provider=provider,
        user_id=current_user.id,
        collection_name=collection_name,
        item_in=item_in,
    )
    return item


@router.get("/{collection_name}", response_model=CollectionItemListPublic)
def list_collection_items(
    *,
    current_user: CurrentUser,
    adapter: collections_deps.CollectionAdapterDep,
    collection_name: str = Path(...),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = collections_service.get_collection_items(
        adapter=adapter,
        user_id=current_user.id,
        collection_name=collection_name,
        skip=skip,
        limit=limit,
    )
    return CollectionItemListPublic(data=items, count=count)


@router.put("/items/{item_id}", response_model=CollectionItemPublic)
def update_collection_item(
    *,
    item: collections_deps.OwnedCollectionItemDep,
    item_in: CollectionItemUpdate,
    adapter: collections_deps.CollectionAdapterDep,
) -> Any:
    updated_item = collections_service.update_collection_item(
        adapter=adapter,
        item_id=item.id,
        item_in=item_in,
    )
    return updated_item


@router.delete("/items/{item_id}")
def remove_from_collection(
    *,
    item: collections_deps.OwnedCollectionItemDep,
    adapter: collections_deps.CollectionAdapterDep,
) -> Any:
    collections_service.remove_collection_item(adapter=adapter, item_id=item.id)
    return Message(message="Removed from collection")
