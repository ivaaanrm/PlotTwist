from __future__ import annotations

from datetime import date
from typing import Protocol, runtime_checkable

from pydantic import BaseModel

from app.media.models import MediaType


class MediaSearchResult(BaseModel):
    external_id: int
    media_type: MediaType
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MediaDetails(BaseModel):
    external_id: int
    media_type: MediaType
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MediaSearchResponse(BaseModel):
    results: list[MediaSearchResult]
    page: int
    total_pages: int
    total_results: int


@runtime_checkable
class MediaProvider(Protocol):
    async def search(
        self, query: str, media_type: MediaType, page: int = 1
    ) -> MediaSearchResponse: ...

    async def get_details(
        self, external_id: int, media_type: MediaType
    ) -> MediaDetails: ...
