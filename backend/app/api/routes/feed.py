from typing import Any

from fastapi import APIRouter
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import get_followed_user_ids
from app.models import (
    FeedItem,
    FeedPublic,
    User,
    UserPublic,
    WatchedMovie,
    WatchedMoviePublic,
)

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/", response_model=FeedPublic)
def get_feed(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """Get activity feed: recent watches/ratings from followed users."""
    followed_ids = get_followed_user_ids(session=session, user_id=current_user.id)

    if not followed_ids:
        return FeedPublic(data=[], count=0)

    count_stmt = (
        select(func.count())
        .select_from(WatchedMovie)
        .where(col(WatchedMovie.user_id).in_(followed_ids))
    )
    count = session.exec(count_stmt).one()

    stmt = (
        select(WatchedMovie)
        .where(col(WatchedMovie.user_id).in_(followed_ids))
        .order_by(col(WatchedMovie.watched_at).desc())
        .offset(skip)
        .limit(limit)
    )
    watched_items = session.exec(stmt).all()

    feed_items = []
    for watched in watched_items:
        user = session.get(User, watched.user_id)
        if user:
            feed_items.append(
                FeedItem(
                    user=UserPublic.model_validate(user),
                    watched_movie=WatchedMoviePublic.model_validate(watched),
                )
            )

    return FeedPublic(data=feed_items, count=count)
