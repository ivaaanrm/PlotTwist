from typing import Any

from fastapi import APIRouter

from app.auth.dependencies import CurrentUser, SessionDep
from app.media import service as media_service
from app.media.dependencies import MediaProviderDep
from app.media.exceptions import EmptyQueryError
from app.media.schemas import MediaPublic, MediaSearchResponse, MediaType

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=MediaSearchResponse)
async def search_movies(
    query: str,
    _current_user: CurrentUser,
    provider: MediaProviderDep,
    page: int = 1,
    media_type: MediaType = MediaType.movie,
) -> Any:
    """Search media via external provider."""
    if not query.strip():
        raise EmptyQueryError()

    return await media_service.search_media(
        provider=provider,
        query=query,
        media_type=media_type,
        page=page,
    )


@router.get("/trending", response_model=MediaSearchResponse)
async def trending_movies(
    _current_user: CurrentUser,
    provider: MediaProviderDep,
    media_type: MediaType = MediaType.movie,
) -> Any:
    """Get trending media from external provider."""
    return await media_service.get_trending_media(
        provider=provider,
        media_type=media_type,
    )


@router.get("/{tmdb_id}", response_model=MediaPublic)
async def get_movie(
    tmdb_id: int,
    session: SessionDep,
    _current_user: CurrentUser,
    provider: MediaProviderDep,
    media_type: MediaType = MediaType.movie,
) -> Any:
    """Get media details. Fetches from provider and caches if not in DB."""
    return await media_service.get_and_cache_media(
        session=session,
        provider=provider,
        tmdb_id=tmdb_id,
        media_type=media_type,
    )
