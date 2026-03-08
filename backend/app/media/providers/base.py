from typing import Protocol, runtime_checkable

from app.media.models import MediaType
from app.media.schemas import MediaDetails, MediaSearchResponse


@runtime_checkable
class MediaProvider(Protocol):
    async def search(
        self, query: str, media_type: MediaType, page: int = 1
    ) -> MediaSearchResponse: ...

    async def get_details(
        self, external_id: int, media_type: MediaType
    ) -> MediaDetails: ...
