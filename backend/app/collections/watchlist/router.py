from typing import Any

from fastapi import APIRouter, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.watchlist import dependencies as watchlist_dependencies
from app.collections.watchlist import service as watchlist_service
from app.collections.watchlist.schemas import (
    Message,
    WatchlistItemCreate,
    WatchlistItemPublic,
    WatchlistItemsPublic,
)
from app.media import service as media_service
from app.media.dependencies import MediaProviderDep


router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("/", response_model=WatchlistItemPublic)
async def add_to_watchlist(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MediaProviderDep,
    item_in: WatchlistItemCreate,
) -> Any:
    details = await provider.get_details(
        external_id=item_in.tmdb_id,
        media_type=item_in.media_type,
    )
    media = media_service.get_or_create_media(session=session, details=details)

    existing = watchlist_service.get_watchlist_item_by_user_and_media(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")

    from app.collections.watched import service as watched_service

    already_watched = watched_service.get_watched_media_by_user_and_media(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
    )
    if already_watched:
        raise HTTPException(status_code=400, detail="Already marked as watched")

    item = watchlist_service.create_watchlist_item(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
    )
    session.refresh(item)
    return item


@router.get("/", response_model=WatchlistItemsPublic)
def list_watchlist(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = watchlist_service.get_watchlist_items(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return WatchlistItemsPublic(data=items, count=count)


@router.delete("/{id}")
def remove_from_watchlist(
    session: SessionDep,
    item: watchlist_dependencies.OwnedWatchlistItemDep,
) -> Message:
    session.delete(item)
    session.commit()
    return Message(message="Removed from watchlist")

