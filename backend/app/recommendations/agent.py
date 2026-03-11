from __future__ import annotations

import json
from typing import Any

import httpx
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool
from pydantic import BaseModel

from app.media.config import tmdb_settings
from app.recommendations.prompts import DISCOVERY_SYSTEM_PROMPT
from app.recommendations.schemas import RecommendationTicket


def _coerce_llm_value(val: Any, target: str) -> Any:
    """Normalize values that Ollama returns as JSON-schema dicts instead of real values.

    Ollama sometimes passes ``{"type": "array", ...}`` or ``{"min_rating": "7.5", "type": "number"}``
    as the *value* of a tool argument instead of the actual data.  This helper
    pulls the real value out so Pydantic validation succeeds.
    """
    if not isinstance(val, dict):
        return val
    # Try common keys that Ollama puts the real value under
    for key in (target, "value", "default"):
        if key in val:
            return val[key]
    return val


class _TMDBDiscoverInput(BaseModel):
    media_type: str  # "movie" or "series"
    genre_ids: list[int]
    year_from: int | None = None
    year_to: int | None = None
    sort_by: str = "popularity.desc"
    min_rating: float | None = None


def _sanitize_tool_args(args: dict[str, Any]) -> dict[str, Any]:
    """Fix Ollama tool-call args that arrive as JSON-schema dicts instead of values.

    Ollama often emits ``{"genre_ids": {"type": "array", ...}, "min_rating": {"type": "number", "value": 7.5}}``
    instead of ``{"genre_ids": [28], "min_rating": 7.5}``.
    We normalise every field **before** LangChain tries Pydantic validation.
    """
    out = dict(args)

    for key, val in out.items():
        # Unwrap schema-style dicts: {"type": "number", "value": 5.5} → 5.5
        if isinstance(val, dict):
            val = _coerce_llm_value(val, key)
            out[key] = val

    # genre_ids → list[int]
    if "genre_ids" in out:
        raw = out["genre_ids"]
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                raw = []
        if isinstance(raw, list):
            out["genre_ids"] = [int(x) for x in raw if str(x).lstrip("-").isdigit()]
        else:
            out["genre_ids"] = []

    # min_rating → float | None
    if "min_rating" in out and out["min_rating"] is not None:
        try:
            out["min_rating"] = float(out["min_rating"])
        except (TypeError, ValueError):
            out["min_rating"] = None

    # year_from / year_to → int | None
    for field in ("year_from", "year_to"):
        if field in out and out[field] is not None:
            try:
                out[field] = int(out[field])
            except (TypeError, ValueError):
                out[field] = None

    return out


class _PickedItem(BaseModel):
    tmdb_id: int
    media_type: str
    reason: str


class _DiscoveryResult(BaseModel):
    picks: list[_PickedItem]


async def _call_tmdb_discover(
    media_type: str,
    genre_ids: list[int],
    year_from: int | None,
    year_to: int | None,
    sort_by: str,
    min_rating: float | None,
    exclude_tmdb_ids: list[int],
) -> str:
    tmdb_type = "movie" if media_type == "movie" else "tv"
    params: dict[str, Any] = {
        "sort_by": sort_by,
        "include_adult": False,
        "vote_count.gte": 100,
        "page": 1,
    }
    if genre_ids:
        params["with_genres"] = ",".join(str(g) for g in genre_ids)
    if year_from:
        key = (
            "primary_release_date.gte" if tmdb_type == "movie" else "first_air_date.gte"
        )
        params[key] = f"{year_from}-01-01"
    if year_to:
        key = (
            "primary_release_date.lte" if tmdb_type == "movie" else "first_air_date.lte"
        )
        params[key] = f"{year_to}-12-31"
    if min_rating:
        params["vote_average.gte"] = min_rating

    headers = {
        "Authorization": f"Bearer {tmdb_settings.TMDB_API_KEY}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{tmdb_settings.TMDB_BASE_URL}/discover/{tmdb_type}",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", [])[:20]:
        tmdb_id = item["id"]
        if tmdb_id in exclude_tmdb_ids:
            continue
        year_str = (item.get("release_date") or item.get("first_air_date") or "")[:4]
        results.append(
            {
                "tmdb_id": tmdb_id,
                "media_type": media_type,
                "title": item.get("title") or item.get("name", ""),
                "year": year_str or None,
                "overview": (item.get("overview") or "")[:200],
                "rating": item.get("vote_average"),
                "poster_path": item.get("poster_path"),
            }
        )
    return json.dumps(results)


async def _fetch_tmdb_details(tmdb_id: int, media_type: str) -> dict[str, Any] | None:
    tmdb_type = "movie" if media_type == "movie" else "tv"
    headers = {
        "Authorization": f"Bearer {tmdb_settings.TMDB_API_KEY}",
        "Accept": "application/json",
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{tmdb_settings.TMDB_BASE_URL}/{tmdb_type}/{tmdb_id}",
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        year_str = (data.get("release_date") or data.get("first_air_date") or "")[:4]
        runtime: int | None = data.get("runtime")
        if not runtime and media_type == "series":
            episode_runtimes = data.get("episode_run_time", [])
            runtime = episode_runtimes[0] if episode_runtimes else None

        return {
            "title": data.get("title") or data.get("name", ""),
            "year": int(year_str) if year_str else None,
            "runtime": runtime,
            "poster_path": data.get("poster_path"),
            "genres": [g["name"] for g in data.get("genres", [])],
            "rating": data.get("vote_average"),
        }
    except Exception:  # noqa: BLE001
        return None


async def run_discovery(
    llm: BaseChatModel,
    qa_transcript: str,
    user_context: str,
    exclude_tmdb_ids: list[int],
) -> list[RecommendationTicket]:
    async def _discover_fn(
        media_type: str,
        genre_ids: list[int],
        year_from: int | None = None,
        year_to: int | None = None,
        sort_by: str = "popularity.desc",
        min_rating: float | None = None,
    ) -> str:
        return await _call_tmdb_discover(
            media_type=media_type,
            genre_ids=genre_ids,
            year_from=year_from,
            year_to=year_to,
            sort_by=sort_by,
            min_rating=min_rating,
            exclude_tmdb_ids=exclude_tmdb_ids,
        )

    discover_tool = StructuredTool.from_function(
        coroutine=_discover_fn,
        name="tmdb_discover",
        description=(
            "Search TMDB Discover endpoint to find movies or series matching criteria. "
            "Returns up to 20 candidate titles with tmdb_id, title, year, rating, overview. "
            "Call multiple times with different params to explore options."
        ),
        args_schema=_TMDBDiscoverInput,
    )

    llm_with_tools = llm.bind_tools([discover_tool])

    messages: list[Any] = [
        SystemMessage(
            content=DISCOVERY_SYSTEM_PROMPT.format(user_context=user_context)
        ),
        HumanMessage(
            content=(
                f"Here is the Q&A with the user:\n\n{qa_transcript}\n\n"
                "Now find the best 3 recommendations using the tmdb_discover tool."
            )
        ),
    ]

    # Agentic tool-calling loop (max 5 iterations)
    for _ in range(5):
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)

        if not response.tool_calls:  # type: ignore[attr-defined]
            break

        for tc in response.tool_calls:  # type: ignore[attr-defined]
            clean_args = _sanitize_tool_args(tc["args"])
            try:
                tool_result = await discover_tool.ainvoke(clean_args)
            except Exception as exc:  # noqa: BLE001
                tool_result = f"Tool error: {exc}"
            messages.append(
                ToolMessage(content=str(tool_result), tool_call_id=tc["id"])
            )

    # Get structured final picks
    pick_prompt = (
        "Based on the search results above, select exactly 3 picks.\n"
        "Return ONLY a JSON object like: "
        '{"picks": [{"tmdb_id": 123, "media_type": "movie", "reason": "..."}]}\n'
        "Each pick needs: tmdb_id (int), media_type ('movie' or 'series'), "
        "and a 1-2 sentence reason referencing the user's answers."
    )
    messages.append(HumanMessage(content=pick_prompt))
    # Try structured output first; fall back to raw JSON parsing for Ollama
    discovery_result: _DiscoveryResult | None = None
    try:
        structured_llm = llm.with_structured_output(_DiscoveryResult)
        discovery_result = await structured_llm.ainvoke(messages)  # type: ignore[assignment]
    except Exception:  # noqa: BLE001
        # Ollama may not support structured output — fall back to raw invoke + parse
        raw_response = await llm.ainvoke(messages)
        text = str(raw_response.content).strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                parsed = json.loads(text[start:end])
                discovery_result = _DiscoveryResult.model_validate(parsed)
            except (json.JSONDecodeError, Exception):  # noqa: BLE001
                pass

    if not discovery_result or not discovery_result.picks:
        return []

    # Fetch full details for each pick and build tickets
    tickets: list[RecommendationTicket] = []
    for pick in discovery_result.picks[:3]:
        details = await _fetch_tmdb_details(pick.tmdb_id, pick.media_type)
        if details:
            tickets.append(
                RecommendationTicket(
                    tmdb_id=pick.tmdb_id,
                    media_type=pick.media_type,  # type: ignore[arg-type]
                    title=details["title"],
                    year=details["year"],
                    runtime_minutes=details["runtime"],
                    poster_path=details["poster_path"],
                    genres=details["genres"],
                    tmdb_rating=details["rating"],
                    reason=pick.reason,
                )
            )

    return tickets
