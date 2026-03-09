import uuid
from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.adapters import CollectionItemAdapter, SqlCollectionAdapter
from app.collections.exceptions import (
    CollectionAccessDeniedError,
    CollectionItemNotFoundError,
    CollectionNotFoundError,
    CollectionOwnerRequiredError,
    UserNotOwnerError,
)
from app.collections.models import Collection, CollectionMember, CollectionRole
from app.collections.schemas import CollectionItemDomain


# ─── Personal collection adapter ───


def get_collection_adapter(session: SessionDep) -> CollectionItemAdapter:
    return SqlCollectionAdapter(session=session)


CollectionAdapterDep = Annotated[CollectionItemAdapter, Depends(get_collection_adapter)]


async def valid_collection_item_id(
    item_id: uuid.UUID,
    adapter: CollectionAdapterDep,
) -> CollectionItemDomain:
    item = adapter.get_by_id(item_id)
    if not item:
        raise CollectionItemNotFoundError()
    return item


ValidCollectionItemDep = Annotated[
    CollectionItemDomain, Depends(valid_collection_item_id)
]


async def get_owned_item(
    item: ValidCollectionItemDep,
    current_user: CurrentUser,
) -> CollectionItemDomain:
    if item.user_id != current_user.id:
        raise UserNotOwnerError()
    return item


OwnedCollectionItemDep = Annotated[CollectionItemDomain, Depends(get_owned_item)]


# ─── Named collection dependencies ───


async def get_collection_or_404(
    collection_id: uuid.UUID,
    session: SessionDep,
) -> Collection:
    collection = session.get(Collection, collection_id)
    if not collection:
        raise CollectionNotFoundError()
    return collection


CollectionDep = Annotated[Collection, Depends(get_collection_or_404)]


async def get_collection_member(
    collection_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> CollectionMember:
    stmt = select(CollectionMember).where(
        CollectionMember.collection_id == collection_id,
        CollectionMember.user_id == current_user.id,
    )
    member = session.exec(stmt).first()
    if not member:
        raise CollectionAccessDeniedError()
    return member


CollectionMemberDep = Annotated[CollectionMember, Depends(get_collection_member)]


async def get_collection_owner(
    member: CollectionMemberDep,
) -> CollectionMember:
    if member.role != CollectionRole.owner:
        raise CollectionOwnerRequiredError()
    return member


CollectionOwnerDep = Annotated[CollectionMember, Depends(get_collection_owner)]
