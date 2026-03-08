import uuid

from sqlmodel import Session, col, func, select

from app.watchlist.models import WatchlistItem


def create_watchlist_item(
    *,
    session: Session,
    user_id: uuid.UUID,
    media_id: uuid.UUID,
) -> WatchlistItem:
    item = WatchlistItem(user_id=user_id, media_id=media_id)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def get_watchlist_items(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[WatchlistItem], int]:
    count_stmt = (
        select(func.count())
        .select_from(WatchlistItem)
        .where(WatchlistItem.user_id == user_id)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(WatchlistItem)
        .where(WatchlistItem.user_id == user_id)
        .order_by(col(WatchlistItem.added_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_watchlist_item_by_user_and_media(
    *,
    session: Session,
    user_id: uuid.UUID,
    media_id: uuid.UUID,
) -> WatchlistItem | None:
    stmt = select(WatchlistItem).where(
        WatchlistItem.user_id == user_id,
        WatchlistItem.media_id == media_id,
    )
    return session.exec(stmt).first()
