from __future__ import annotations

import json
import uuid
from collections import Counter
from uuid import UUID

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from sqlmodel import Session, select

from app.collections.models import CollectionItem
from app.media.models import Media
from app.recommendations.agent import run_discovery
from app.recommendations.llm import get_llm
from app.recommendations.prompts import QA_SYSTEM_PROMPT
from app.recommendations.schemas import (
    QuestionResponse,
    RecommendationsResponse,
)
from app.recommendations.session import (
    decode_token,
    dicts_to_msgs,
    encode_token,
    msgs_to_dicts,
)

TOTAL_STEPS = 5
MAX_STEPS = 6


def _build_user_context(db: Session, user_id: UUID) -> tuple[str, list[int]]:
    rows = db.exec(
        select(CollectionItem, Media)
        .join(Media, CollectionItem.media_id == Media.id)  # type: ignore[arg-type]
        .where(CollectionItem.user_id == user_id)
        .where(CollectionItem.rating.is_not(None))  # type: ignore[union-attr]
        .order_by(CollectionItem.rating.desc())  # type: ignore[union-attr]
        .limit(50)
    ).all()

    if not rows:
        return "No watch history yet.", []

    watched_tmdb_ids: list[int] = []
    genre_counts: Counter[str] = Counter()
    loved_titles: list[str] = []

    for item, media in rows:
        watched_tmdb_ids.append(media.tmdb_id)
        if media.genres:
            try:
                for g in json.loads(media.genres):
                    genre_counts[g] += 1
            except (json.JSONDecodeError, TypeError):
                pass
        if item.rating and item.rating >= 4.0:
            loved_titles.append(media.title)

    parts: list[str] = []
    if genre_counts:
        top = [g for g, _ in genre_counts.most_common(5)]
        parts.append(f"Favorite genres: {', '.join(top)}")
    if loved_titles[:5]:
        parts.append(f"Loved titles: {', '.join(loved_titles[:5])}")
    parts.append(
        f"Already watched {len(watched_tmdb_ids)} titles — exclude from recommendations."
    )
    return "\n".join(parts), watched_tmdb_ids


def _parse_qa_response(content: object) -> dict[str, object]:
    text = str(content).strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])  # type: ignore[return-value]
        except json.JSONDecodeError:
            pass
    return {"question": text, "options": None, "ready": False}


def _build_transcript(history: list) -> str:  # type: ignore[type-arg]
    lines: list[str] = []
    # history[0] = SystemMessage, history[1] = initial HumanMessage trigger
    for msg in history[2:]:
        if isinstance(msg, AIMessage):
            parsed = _parse_qa_response(msg.content)
            lines.append(f"Assistant: {parsed.get('question', msg.content)}")
        elif isinstance(msg, HumanMessage):
            lines.append(f"User: {msg.content}")
    return "\n".join(lines)


async def start_session(db: Session, user_id: UUID) -> QuestionResponse:
    user_context, watched_ids = _build_user_context(db, user_id)

    history = [
        SystemMessage(content=QA_SYSTEM_PROMPT.format(user_context=user_context)),
        HumanMessage(content="Start the questionnaire. Ask the first question."),
    ]

    llm = get_llm()
    response = await llm.ainvoke(history)
    history.append(response)

    parsed = _parse_qa_response(response.content)
    token = encode_token(
        {
            "user_context": user_context,
            "watched_tmdb_ids": watched_ids,
            "history": msgs_to_dicts(history),
            "step": 1,
        }
    )

    return QuestionResponse(
        session_id=str(uuid.uuid4()),
        history_token=token,
        step=1,
        total_steps=TOTAL_STEPS,
        question=str(parsed.get("question", "")),
        options=parsed.get("options"),  # type: ignore[arg-type]
    )


async def answer(
    answer_text: str,
    history_token: str,
) -> QuestionResponse | RecommendationsResponse:
    payload = decode_token(history_token)
    history = dicts_to_msgs(payload["history"])
    step: int = payload["step"]
    user_context: str = payload["user_context"]
    watched_ids: list[int] = payload["watched_tmdb_ids"]

    history.append(HumanMessage(content=answer_text))

    llm = get_llm()
    response = await llm.ainvoke(history)
    history.append(response)
    step += 1

    parsed = _parse_qa_response(response.content)
    ready = bool(parsed.get("ready", False)) or step >= MAX_STEPS

    if ready:
        transcript = _build_transcript(history)
        tickets = await run_discovery(
            llm=llm,
            qa_transcript=transcript,
            user_context=user_context,
            exclude_tmdb_ids=watched_ids,
        )
        return RecommendationsResponse(
            session_id=str(uuid.uuid4()),
            recommendations=tickets,
        )

    token = encode_token(
        {
            "user_context": user_context,
            "watched_tmdb_ids": watched_ids,
            "history": msgs_to_dicts(history),
            "step": step,
        }
    )
    return QuestionResponse(
        session_id=str(uuid.uuid4()),
        history_token=token,
        step=step,
        total_steps=TOTAL_STEPS,
        question=str(parsed.get("question", "")),
        options=parsed.get("options"),  # type: ignore[arg-type]
    )
