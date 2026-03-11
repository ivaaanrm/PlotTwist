from typing import Literal

from pydantic import BaseModel


class QuestionResponse(BaseModel):
    session_id: str
    phase: Literal["questioning"] = "questioning"
    step: int
    total_steps: int
    question: str
    options: list[str] | None
    history_token: str  # encoded conversation state — client must echo back


class AnswerRequest(BaseModel):
    answer: str
    history_token: str  # token received from previous QuestionResponse


class RecommendationTicket(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "series"]
    title: str
    year: int | None
    runtime_minutes: int | None
    poster_path: str | None
    genres: list[str]
    tmdb_rating: float | None
    reason: str


class RecommendationsResponse(BaseModel):
    session_id: str
    phase: Literal["complete"] = "complete"
    recommendations: list[RecommendationTicket]
