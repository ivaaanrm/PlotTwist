import uuid
from typing import Annotated

from fastapi import Depends

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.adapters import CollectionItemAdapter, SqlCollectionAdapter
from app.collections.exceptions import CollectionItemNotFoundError, UserNotOwnerError
from app.collections.schemas import CollectionItemDomain


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
