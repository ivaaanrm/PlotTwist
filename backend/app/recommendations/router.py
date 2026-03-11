from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth.dependencies import CurrentUser, get_db
from app.recommendations import service as recommendation_service
from app.recommendations.schemas import (
    AnswerRequest,
    QuestionResponse,
    RecommendationsResponse,
)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post("/sessions", response_model=QuestionResponse)
async def start_session(
    current_user: CurrentUser,
    db: SessionDep,
) -> Any:
    """Start a new recommendation session. Returns the first question + history_token."""
    return await recommendation_service.start_session(db=db, user_id=current_user.id)


@router.post(
    "/sessions/{session_id}/answer",
    response_model=QuestionResponse | RecommendationsResponse,
)
async def submit_answer(
    session_id: str,  # noqa: ARG001 — kept for URL compatibility
    body: AnswerRequest,
    current_user: CurrentUser,  # noqa: ARG001
    db: SessionDep,  # noqa: ARG001
) -> Any:
    """Submit an answer. history_token in body carries all state — no server-side lookup."""
    return await recommendation_service.answer(
        answer_text=body.answer,
        history_token=body.history_token,
    )
