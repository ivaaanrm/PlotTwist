import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, MovieProviderDep, SessionDep
from app.crud import (
    create_watched_movie,
    get_or_create_movie,
    get_watched_movie_by_user_and_movie,
    get_watched_movies,
    get_watchlist_item_by_user_and_movie,
)
from app.models import (
    Message,
    WatchedMovie,
    WatchedMovieCreate,
    WatchedMoviePublic,
    WatchedMoviesPublic,
    WatchedMovieUpdate,
)

router = APIRouter(prefix="/watched", tags=["watched"])


@router.post("/", response_model=WatchedMoviePublic)
async def mark_as_watched(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MovieProviderDep,
    watched_in: WatchedMovieCreate,
) -> Any:
    """Mark a movie as watched. Removes from watchlist if present."""
    details = await provider.get_details(external_id=watched_in.tmdb_id)
    movie = get_or_create_movie(session=session, details=details)

    existing = get_watched_movie_by_user_and_movie(
        session=session, user_id=current_user.id, movie_id=movie.id
    )
    if existing:
        raise HTTPException(status_code=400, detail="Movie already marked as watched")

    # Remove from watchlist if present
    watchlist_item = get_watchlist_item_by_user_and_movie(
        session=session, user_id=current_user.id, movie_id=movie.id
    )
    if watchlist_item:
        session.delete(watchlist_item)

    watched = create_watched_movie(
        session=session,
        user_id=current_user.id,
        movie_id=movie.id,
        rating=watched_in.rating,
    )
    session.refresh(watched)
    return watched


@router.get("/", response_model=WatchedMoviesPublic)
def list_watched(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """List current user's watched movies."""
    items, count = get_watched_movies(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return WatchedMoviesPublic(data=items, count=count)


@router.patch("/{id}", response_model=WatchedMoviePublic)
def update_watched(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    watched_in: WatchedMovieUpdate,
) -> Any:
    """Update rating on a watched movie."""
    watched = session.get(WatchedMovie, id)
    if not watched:
        raise HTTPException(status_code=404, detail="Watched movie not found")
    if watched.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    watched.rating = watched_in.rating
    session.add(watched)
    session.commit()
    session.refresh(watched)
    return watched


@router.delete("/{id}")
def remove_watched(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Message:
    """Remove a movie from watched list."""
    watched = session.get(WatchedMovie, id)
    if not watched:
        raise HTTPException(status_code=404, detail="Watched movie not found")
    if watched.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(watched)
    session.commit()
    return Message(message="Movie removed from watched list")
