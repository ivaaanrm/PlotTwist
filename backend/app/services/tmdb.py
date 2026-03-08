from __future__ import annotations

from datetime import date

import httpx

from app.services.movie_provider import (
    MovieDetails,
    MovieProvider,
    MovieSearchResponse,
    MovieSearchResult,
)


def _parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


class TMDBProvider:
    """TMDB implementation of MovieProvider."""

    def __init__(self, api_key: str, base_url: str = "https://api.themoviedb.org/3") -> None:
        self._api_key = api_key
        self._base_url = base_url

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "application/json",
        }

    async def search(self, query: str, page: int = 1) -> MovieSearchResponse:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/search/movie",
                params={"query": query, "page": page, "include_adult": False},
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

        results = [
            MovieSearchResult(
                external_id=item["id"],
                title=item["title"],
                overview=item.get("overview"),
                poster_path=item.get("poster_path"),
                backdrop_path=item.get("backdrop_path"),
                release_date=_parse_date(item.get("release_date")),
                rating=item.get("vote_average"),
                genres=[],
            )
            for item in data.get("results", [])
        ]

        return MovieSearchResponse(
            results=results,
            page=data.get("page", 1),
            total_pages=data.get("total_pages", 1),
            total_results=data.get("total_results", 0),
        )

    async def get_details(self, external_id: int) -> MovieDetails:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/movie/{external_id}",
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

        return MovieDetails(
            external_id=data["id"],
            title=data["title"],
            overview=data.get("overview"),
            poster_path=data.get("poster_path"),
            backdrop_path=data.get("backdrop_path"),
            release_date=_parse_date(data.get("release_date")),
            rating=data.get("vote_average"),
            genres=[g["name"] for g in data.get("genres", [])],
        )


# Ensure TMDBProvider satisfies the protocol
def _check_protocol() -> None:
    provider: MovieProvider = TMDBProvider(api_key="")  # noqa: F841


_check_protocol()
