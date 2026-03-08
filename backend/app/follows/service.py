import uuid

from sqlmodel import Session, col, func, select

from app.follows.models import Follow, FollowStatus


def create_follow(
    *,
    session: Session,
    follower_id: uuid.UUID,
    following_id: uuid.UUID,
) -> Follow:
    follow = Follow(follower_id=follower_id, following_id=following_id)
    session.add(follow)
    session.commit()
    session.refresh(follow)
    return follow


def get_follow(
    *,
    session: Session,
    follower_id: uuid.UUID,
    following_id: uuid.UUID,
) -> Follow | None:
    stmt = select(Follow).where(
        Follow.follower_id == follower_id,
        Follow.following_id == following_id,
    )
    return session.exec(stmt).first()


def get_follow_by_id(*, session: Session, follow_id: uuid.UUID) -> Follow | None:
    return session.get(Follow, follow_id)


def get_pending_follow_requests(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Follow], int]:
    count_stmt = (
        select(func.count())
        .select_from(Follow)
        .where(Follow.following_id == user_id, Follow.status == FollowStatus.pending)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(Follow)
        .where(Follow.following_id == user_id, Follow.status == FollowStatus.pending)
        .order_by(col(Follow.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_followers(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Follow], int]:
    count_stmt = (
        select(func.count())
        .select_from(Follow)
        .where(Follow.following_id == user_id, Follow.status == FollowStatus.accepted)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(Follow)
        .where(Follow.following_id == user_id, Follow.status == FollowStatus.accepted)
        .order_by(col(Follow.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_following(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Follow], int]:
    count_stmt = (
        select(func.count())
        .select_from(Follow)
        .where(Follow.follower_id == user_id, Follow.status == FollowStatus.accepted)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(Follow)
        .where(Follow.follower_id == user_id, Follow.status == FollowStatus.accepted)
        .order_by(col(Follow.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_followed_user_ids(*, session: Session, user_id: uuid.UUID) -> list[uuid.UUID]:
    stmt = select(Follow.following_id).where(
        Follow.follower_id == user_id,
        Follow.status == FollowStatus.accepted,
    )
    return list(session.exec(stmt).all())
