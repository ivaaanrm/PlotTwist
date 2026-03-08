from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, MovieProviderDep, SessionDep
from app.crud import get_movie_by_tmdb_id, get_or_create_movie
from app.models import MoviePublic
from app.services.movie_provider import MovieSearchResponse

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=MovieSearchResponse)
async def search_movies(
    query: str,
    current_user: CurrentUser,
    provider: MovieProviderDep,
    page: int = 1,
) -> Any:
    """Search movies via external provider."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return await provider.search(query=query, page=page)


@router.get("/{tmdb_id}", response_model=MoviePublic)
async def get_movie(
    tmdb_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    provider: MovieProviderDep,
) -> Any:
    """Get movie details. Fetches from provider and caches if not in DB."""
    movie = get_movie_by_tmdb_id(session=session, tmdb_id=tmdb_id)
    if movie:
        return movie
    details = await provider.get_details(external_id=tmdb_id)
    movie = get_or_create_movie(session=session, details=details)
    return movie
