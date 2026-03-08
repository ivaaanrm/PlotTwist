from __future__ import annotations

from datetime import date
from typing import Protocol, runtime_checkable

from pydantic import BaseModel


class MovieSearchResult(BaseModel):
    external_id: int
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MovieDetails(BaseModel):
    external_id: int
    title: str
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    release_date: date | None = None
    rating: float | None = None
    genres: list[str] = []


class MovieSearchResponse(BaseModel):
    results: list[MovieSearchResult]
    page: int
    total_pages: int
    total_results: int


@runtime_checkable
class MovieProvider(Protocol):
    async def search(self, query: str, page: int = 1) -> MovieSearchResponse: ...

    async def get_details(self, external_id: int) -> MovieDetails: ...
