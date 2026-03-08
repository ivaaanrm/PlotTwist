from __future__ import annotations

from datetime import date

import httpx

from app.media.models import MediaType
from app.media.provider import (
    MediaDetails,
    MediaProvider,
    MediaSearchResponse,
    MediaSearchResult,
)


def _parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


_TMDB_PATHS = {
    MediaType.movie: {"search": "/search/movie", "details": "/movie"},
    MediaType.series: {"search": "/search/tv", "details": "/tv"},
}


class TMDBProvider:
    """TMDB implementation of MediaProvider."""

    def __init__(
        self, api_key: str, base_url: str = "https://api.themoviedb.org/3"
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "application/json",
        }

    async def search(
        self, query: str, media_type: MediaType, page: int = 1
    ) -> MediaSearchResponse:
        path = _TMDB_PATHS[media_type]["search"]
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}{path}",
                params={"query": query, "page": page, "include_adult": False},
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

        results = [
            MediaSearchResult(
                external_id=item["id"],
                media_type=media_type,
                title=item.get("title") or item.get("name", ""),
                overview=item.get("overview"),
                poster_path=item.get("poster_path"),
                backdrop_path=item.get("backdrop_path"),
                release_date=_parse_date(
                    item.get("release_date") or item.get("first_air_date")
                ),
                rating=item.get("vote_average"),
                genres=[],
            )
            for item in data.get("results", [])
        ]

        return MediaSearchResponse(
            results=results,
            page=data.get("page", 1),
            total_pages=data.get("total_pages", 1),
            total_results=data.get("total_results", 0),
        )

    async def get_details(
        self, external_id: int, media_type: MediaType
    ) -> MediaDetails:
        path = _TMDB_PATHS[media_type]["details"]
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}{path}/{external_id}",
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

        return MediaDetails(
            external_id=data["id"],
            media_type=media_type,
            title=data.get("title") or data.get("name", ""),
            overview=data.get("overview"),
            poster_path=data.get("poster_path"),
            backdrop_path=data.get("backdrop_path"),
            release_date=_parse_date(
                data.get("release_date") or data.get("first_air_date")
            ),
            rating=data.get("vote_average"),
            genres=[g["name"] for g in data.get("genres", [])],
        )


def _check_protocol() -> None:
    provider: MediaProvider = TMDBProvider(api_key="")  # noqa: F841


_check_protocol()
