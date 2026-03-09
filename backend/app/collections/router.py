import uuid
from typing import Any

from fastapi import APIRouter, Path

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections import dependencies as collections_deps
from app.collections import service as collections_service
from app.collections.schemas import (
    CollectionCreate,
    CollectionDetailPublic,
    CollectionInvitationCreate,
    CollectionInvitationListPublic,
    CollectionInvitationPublic,
    CollectionInvitationUpdate,
    CollectionItemCreate,
    CollectionItemListPublic,
    CollectionItemPublic,
    CollectionItemUpdate,
    CollectionListPublic,
    CollectionPublic,
    CollectionUpdate,
    Message,
    ReorderRequest,
)
from app.media.dependencies import MediaProviderDep

router = APIRouter(prefix="/collections", tags=["collections"])


# ─── Named Collection CRUD ───
# These must come before /{collection_name} to avoid "named" being captured.


@router.post("/named", response_model=CollectionPublic, tags=["named-collections"])
def create_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    data: CollectionCreate,
) -> Any:
    return collections_service.create_collection(
        session=session,
        owner_id=current_user.id,
        data=data,
    )


@router.get("/named", response_model=CollectionListPublic, tags=["named-collections"])
def list_named_collections(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    collections, count = collections_service.get_user_collections(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return CollectionListPublic(data=collections, count=count)


@router.get(
    "/named/{collection_id}",
    response_model=CollectionDetailPublic,
    tags=["named-collections"],
)
def get_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
) -> Any:
    return collections_service.get_collection_detail(
        session=session,
        collection_id=collection_id,
        user_id=current_user.id,
    )


@router.patch(
    "/named/{collection_id}",
    response_model=CollectionPublic,
    tags=["named-collections"],
)
def update_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
    data: CollectionUpdate,
) -> Any:
    return collections_service.update_collection(
        session=session,
        collection_id=collection_id,
        user_id=current_user.id,
        data=data,
    )


@router.delete("/named/{collection_id}", tags=["named-collections"])
def delete_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
) -> Any:
    collections_service.delete_collection(
        session=session,
        collection_id=collection_id,
        user_id=current_user.id,
    )
    return Message(message="Collection deleted")


# ─── Named Collection Items ───


@router.post(
    "/named/{collection_id}/items",
    response_model=CollectionItemPublic,
    tags=["named-collections"],
)
async def add_to_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MediaProviderDep,
    collection_id: uuid.UUID = Path(...),
    item_in: CollectionItemCreate,
) -> Any:
    return await collections_service.add_item_to_named_collection(
        session=session,
        provider=provider,
        collection_id=collection_id,
        user_id=current_user.id,
        item_in=item_in,
    )


@router.delete(
    "/named/{collection_id}/items/{item_id}",
    tags=["named-collections"],
)
def remove_from_named_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
    item_id: uuid.UUID = Path(...),
) -> Any:
    collections_service.remove_item_from_named_collection(
        session=session,
        collection_id=collection_id,
        item_id=item_id,
        user_id=current_user.id,
    )
    return Message(message="Removed from collection")


@router.patch(
    "/named/{collection_id}/items/reorder",
    tags=["named-collections"],
)
def reorder_named_collection_items(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
    data: ReorderRequest,
) -> Any:
    collections_service.reorder_collection_items(
        session=session,
        collection_id=collection_id,
        user_id=current_user.id,
        data=data,
    )
    return Message(message="Items reordered")


# ─── Invitations ───


@router.post(
    "/named/{collection_id}/invitations",
    response_model=CollectionInvitationPublic,
    tags=["named-collections"],
)
def invite_to_collection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
    data: CollectionInvitationCreate,
) -> Any:
    return collections_service.create_invitation(
        session=session,
        collection_id=collection_id,
        sender_id=current_user.id,
        data=data,
    )


@router.get(
    "/invitations/received",
    response_model=CollectionInvitationListPublic,
    tags=["named-collections"],
)
def list_received_invitations(
    *,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    invitations, count = collections_service.get_received_invitations(
        session=session,
        user_id=current_user.id,
    )
    return CollectionInvitationListPublic(data=invitations, count=count)


@router.patch(
    "/invitations/{invitation_id}",
    response_model=CollectionInvitationPublic,
    tags=["named-collections"],
)
def respond_to_invitation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    invitation_id: uuid.UUID = Path(...),
    data: CollectionInvitationUpdate,
) -> Any:
    return collections_service.respond_to_invitation(
        session=session,
        invitation_id=invitation_id,
        user_id=current_user.id,
        status=data.status,
    )


# ─── Members ───


@router.delete(
    "/named/{collection_id}/members/{user_id}",
    tags=["named-collections"],
)
def remove_collection_member(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    collection_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Path(...),
) -> Any:
    collections_service.remove_member(
        session=session,
        collection_id=collection_id,
        member_user_id=user_id,
        requester_id=current_user.id,
    )
    return Message(message="Member removed")


# ─── Personal collection endpoints ───
# These use /{collection_name} which is a catch-all, so they must come last.


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
