import uuid

from sqlmodel import Session, col, func, select

from app.collections.watched.models import WatchedMedia


def create_watched_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    media_id: uuid.UUID,
    rating: float | None = None,
) -> WatchedMedia:
    watched = WatchedMedia(user_id=user_id, media_id=media_id, rating=rating)
    session.add(watched)
    session.commit()
    session.refresh(watched)
    return watched


def get_watched_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[WatchedMedia], int]:
    count_stmt = (
        select(func.count())
        .select_from(WatchedMedia)
        .where(WatchedMedia.user_id == user_id)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(WatchedMedia)
        .where(WatchedMedia.user_id == user_id)
        .order_by(col(WatchedMedia.watched_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_watched_media_by_user_and_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    media_id: uuid.UUID,
) -> WatchedMedia | None:
    stmt = select(WatchedMedia).where(
        WatchedMedia.user_id == user_id,
        WatchedMedia.media_id == media_id,
    )
    return session.exec(stmt).first()

