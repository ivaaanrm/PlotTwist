import uuid
from typing import Annotated

from fastapi import Depends

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.watchlist.exceptions import (
    WatchlistItemNotFoundError,
    WatchlistPermissionError,
)
from app.collections.watchlist.models import WatchlistItem


def get_owned_watchlist_item(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> WatchlistItem:
    item = session.get(WatchlistItem, id)
    if not item:
        raise WatchlistItemNotFoundError()
    if item.user_id != current_user.id:
        raise WatchlistPermissionError()
    return item


OwnedWatchlistItemDep = Annotated[WatchlistItem, Depends(get_owned_watchlist_item)]
