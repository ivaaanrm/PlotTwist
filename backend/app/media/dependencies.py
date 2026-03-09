from typing import Annotated

from fastapi import Depends

from app.media.config import tmdb_settings
from app.media.providers.base import MediaProvider
from app.media.providers.tmdb import TMDBProvider


def get_media_provider() -> MediaProvider:
    return TMDBProvider(
        api_key=tmdb_settings.TMDB_API_KEY,
        base_url=tmdb_settings.TMDB_BASE_URL,
    )


MediaProviderDep = Annotated[MediaProvider, Depends(get_media_provider)]
MovieProviderDep = MediaProviderDep
