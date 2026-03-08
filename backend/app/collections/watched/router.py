from typing import Any

from fastapi import APIRouter, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.watched import dependencies as watched_dependencies
from app.collections.watched import service as watched_service
from app.collections.watched.schemas import (
    Message,
    WatchedMediaCreate,
    WatchedMediaListPublic,
    WatchedMediaPublic,
    WatchedMediaUpdate,
)
from app.media import service as media_service
from app.media.dependencies import MediaProviderDep
from app.media.schemas import MediaType

from app.collections.watchlist import service as watchlist_service


router = APIRouter(prefix="/watched", tags=["watched"])


@router.post("/", response_model=WatchedMediaPublic)
async def mark_as_watched(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MediaProviderDep,
    watched_in: WatchedMediaCreate,
) -> Any:
    """Mark a movie or series as watched. Removes from watchlist if present."""
    details = await provider.get_details(
        external_id=watched_in.tmdb_id,
        media_type=watched_in.media_type,
    )
    media = media_service.get_or_create_media(session=session, details=details)

    existing = watched_service.get_watched_media_by_user_and_media(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already marked as watched")

    watchlist_item = watchlist_service.get_watchlist_item_by_user_and_media(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
    )
    if watchlist_item:
        session.delete(watchlist_item)

    watched = watched_service.create_watched_media(
        session=session,
        user_id=current_user.id,
        media_id=media.id,
        rating=watched_in.rating,
    )
    session.refresh(watched)
    return watched


@router.get("/", response_model=WatchedMediaListPublic)
def list_watched(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = watched_service.get_watched_media(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return WatchedMediaListPublic(data=items, count=count)


@router.patch("/{id}", response_model=WatchedMediaPublic)
def update_watched(
    *,
    session: SessionDep,
    watched: watched_dependencies.OwnedWatchedMediaDep,
    watched_in: WatchedMediaUpdate,
) -> Any:
    watched.rating = watched_in.rating
    session.add(watched)
    session.commit()
    session.refresh(watched)
    return watched


@router.delete("/{id}")
def remove_watched(
    session: SessionDep,
    watched: watched_dependencies.OwnedWatchedMediaDep,
) -> Message:
    session.delete(watched)
    session.commit()
    return Message(message="Removed from watched list")

