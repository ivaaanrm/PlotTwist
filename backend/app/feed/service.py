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
    if not followed_ids:
        return [], 0

    count_stmt = (
        select(func.count())
        .select_from(CollectionItem)
        .where(
            col(CollectionItem.user_id).in_(followed_ids),
            CollectionItem.collection_name == "watched",
        )
    )
    count = session.exec(count_stmt).one()

    stmt = (
        select(CollectionItem)
        .where(
            col(CollectionItem.user_id).in_(followed_ids),
            CollectionItem.collection_name == "watched",
        )
        .order_by(col(CollectionItem.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    collection_items = session.exec(stmt).all()

    result: list[tuple[User, CollectionItem]] = []
    for item in collection_items:
        user = session.get(User, item.user_id)
        if user:
            result.append((user, item))
    return result, count
