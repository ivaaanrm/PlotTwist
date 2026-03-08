import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, MovieProviderDep, SessionDep
from app.crud import (
    create_watchlist_item,
    get_or_create_movie,
    get_watched_movie_by_user_and_movie,
    get_watchlist_item_by_user_and_movie,
    get_watchlist_items,
)
from app.models import (
    Message,
    WatchlistItem,
    WatchlistItemCreate,
    WatchlistItemPublic,
    WatchlistItemsPublic,
)

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("/", response_model=WatchlistItemPublic)
async def add_to_watchlist(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MovieProviderDep,
    item_in: WatchlistItemCreate,
) -> Any:
    """Add a movie to the watchlist."""
    details = await provider.get_details(external_id=item_in.tmdb_id)
    movie = get_or_create_movie(session=session, details=details)

    existing = get_watchlist_item_by_user_and_movie(
        session=session, user_id=current_user.id, movie_id=movie.id
    )
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in watchlist")

    already_watched = get_watched_movie_by_user_and_movie(
        session=session, user_id=current_user.id, movie_id=movie.id
    )
    if already_watched:
        raise HTTPException(status_code=400, detail="Movie already marked as watched")

    item = create_watchlist_item(
        session=session, user_id=current_user.id, movie_id=movie.id
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
    """List current user's watchlist."""
    items, count = get_watchlist_items(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return WatchlistItemsPublic(data=items, count=count)


@router.delete("/{id}")
def remove_from_watchlist(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Message:
    """Remove a movie from the watchlist."""
    item = session.get(WatchlistItem, id)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(item)
    session.commit()
    return Message(message="Movie removed from watchlist")
