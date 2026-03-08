from typing import Any

from fastapi import APIRouter

from app.auth.dependencies import CurrentUser, SessionDep
from app.feed import service as feed_service
from app.feed.schemas import FeedItem, FeedPublic, UserPublic, WatchedMediaPublic

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/", response_model=FeedPublic)
def get_feed(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    rows, count = feed_service.get_feed_watched_media(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    feed_items = [
        FeedItem(
            user=UserPublic.model_validate(user),
            watched_media=WatchedMediaPublic.model_validate(watched),
        )
        for user, watched in rows
    ]
    return FeedPublic(data=feed_items, count=count)
