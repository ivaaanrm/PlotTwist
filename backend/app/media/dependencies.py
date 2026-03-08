from typing import Annotated

from fastapi import Depends

from app.config import settings
from app.media.provider import MediaProvider
from app.media.tmdb import TMDBProvider


def get_media_provider() -> MediaProvider:
    return TMDBProvider(
        api_key=settings.TMDB_API_KEY,
        base_url=settings.TMDB_BASE_URL,
    )


MediaProviderDep = Annotated[MediaProvider, Depends(get_media_provider)]
MovieProviderDep = MediaProviderDep
