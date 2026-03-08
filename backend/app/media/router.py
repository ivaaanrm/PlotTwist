from typing import Any

from fastapi import APIRouter, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.media import service as media_service
from app.media.dependencies import MediaProviderDep
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
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    return await provider.search(
        query=query,
        media_type=media_type,
        page=page,
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
    media = media_service.get_media_by_tmdb_id(
        session=session,
        tmdb_id=tmdb_id,
        media_type=media_type,
    )
    if media:
        return media

    details = await provider.get_details(
        external_id=tmdb_id,
        media_type=media_type,
    )
    return media_service.get_or_create_media(session=session, details=details)
