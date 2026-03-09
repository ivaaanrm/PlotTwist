import uuid

from sqlmodel import Session, col, func, select

from app.collections.models import CollectionItem
from app.users.follows import service as follows_service
from app.users.models import User


def get_feed_watched_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[tuple[User, CollectionItem]], int]:
    followed_ids = follows_service.get_followed_user_ids(
        session=session, user_id=user_id
    )

    # Include own user id alongside followed users
    feed_user_ids = list(followed_ids) + [user_id]

    count_stmt = (
        select(func.count())
        .select_from(CollectionItem)
        .where(
            col(CollectionItem.user_id).in_(feed_user_ids),
            CollectionItem.collection_name == "watched",
        )
    )
    count = session.exec(count_stmt).one()

    stmt = (
        select(User, CollectionItem)
        .join(User, col(CollectionItem.user_id) == col(User.id))
        .where(
            col(CollectionItem.user_id).in_(feed_user_ids),
            CollectionItem.collection_name == "watched",
        )
        .order_by(col(CollectionItem.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    rows = session.exec(stmt).all()

    result: list[tuple[User, CollectionItem]] = []
    for user, item in rows:
        # Eagerly access media so it's loaded before leaving the session
        _ = item.media
        result.append((user, item))
    return result, count
