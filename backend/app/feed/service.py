import uuid

from sqlmodel import Session, col, func, select

from app.collections.watched.models import WatchedMedia
from app.users.follows import service as follows_service
from app.users.models import User


def get_feed_watched_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[tuple[User, WatchedMedia]], int]:
    followed_ids = follows_service.get_followed_user_ids(
        session=session, user_id=user_id
    )
    if not followed_ids:
        return [], 0

    count_stmt = (
        select(func.count())
        .select_from(WatchedMedia)
        .where(col(WatchedMedia.user_id).in_(followed_ids))
    )
    count = session.exec(count_stmt).one()

    stmt = (
        select(WatchedMedia)
        .where(col(WatchedMedia.user_id).in_(followed_ids))
        .order_by(col(WatchedMedia.watched_at).desc())
        .offset(skip)
        .limit(limit)
    )
    watched_items = session.exec(stmt).all()

    result: list[tuple[User, WatchedMedia]] = []
    for watched in watched_items:
        user = session.get(User, watched.user_id)
        if user:
            result.append((user, watched))
    return result, count
