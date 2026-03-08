import uuid
from typing import Annotated

from fastapi import Depends, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.watchlist.models import WatchlistItem


def get_owned_watchlist_item(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> WatchlistItem:
    item = session.get(WatchlistItem, id)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return item


OwnedWatchlistItemDep = Annotated[WatchlistItem, Depends(get_owned_watchlist_item)]

