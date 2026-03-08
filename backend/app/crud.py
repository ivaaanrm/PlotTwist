import json
import uuid
from typing import Any

from sqlmodel import Session, col, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Follow,
    FollowStatus,
    Movie,
    User,
    UserCreate,
    UserUpdate,
    WatchedMovie,
    WatchlistItem,
)
from app.services.movie_provider import MovieDetails


# ── User CRUD ────────────────────────────────────────────────────────────────


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


# ── Movie CRUD ───────────────────────────────────────────────────────────────


def get_or_create_movie(*, session: Session, details: MovieDetails) -> Movie:
    """Get a movie by tmdb_id, or create it from provider details."""
    statement = select(Movie).where(Movie.tmdb_id == details.external_id)
    movie = session.exec(statement).first()
    if movie:
        return movie
    movie = Movie(
        tmdb_id=details.external_id,
        title=details.title,
        overview=details.overview,
        poster_path=details.poster_path,
        backdrop_path=details.backdrop_path,
        release_date=details.release_date,
        tmdb_rating=details.rating,
        genres=json.dumps(details.genres) if details.genres else None,
    )
    session.add(movie)
    session.commit()
    session.refresh(movie)
    return movie


def get_movie_by_tmdb_id(*, session: Session, tmdb_id: int) -> Movie | None:
    statement = select(Movie).where(Movie.tmdb_id == tmdb_id)
    return session.exec(statement).first()


# ── WatchedMovie CRUD ────────────────────────────────────────────────────────


def create_watched_movie(
    *,
    session: Session,
    user_id: uuid.UUID,
    movie_id: uuid.UUID,
    rating: float | None = None,
) -> WatchedMovie:
    watched = WatchedMovie(user_id=user_id, movie_id=movie_id, rating=rating)
    session.add(watched)
    session.commit()
    session.refresh(watched)
    return watched


def get_watched_movies(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50
) -> tuple[list[WatchedMovie], int]:
    count_stmt = (
        select(func.count())
        .select_from(WatchedMovie)
        .where(WatchedMovie.user_id == user_id)
    )
    count = session.exec(count_stmt).one()
    stmt = (
        select(WatchedMovie)
        .where(WatchedMovie.user_id == user_id)
        .order_by(col(WatchedMovie.watched_at).desc())
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(stmt).all()
    return list(items), count


def get_watched_movie_by_user_and_movie(
    *, session: Session, user_id: uuid.UUID, movie_id: uuid.UUID
) -> WatchedMovie | None:
    stmt = select(WatchedMovie).where(
        WatchedMovie.user_id == user_id, WatchedMovie.movie_id == movie_id
    )
    return session.exec(stmt).first()


# ── WatchlistItem CRUD ───────────────────────────────────────────────────────


def create_watchlist_item(
    *, session: Session, user_id: uuid.UUID, movie_id: uuid.UUID
) -> WatchlistItem:
    item = WatchlistItem(user_id=user_id, movie_id=movie_id)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def get_watchlist_items(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50
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


def get_watchlist_item_by_user_and_movie(
    *, session: Session, user_id: uuid.UUID, movie_id: uuid.UUID
) -> WatchlistItem | None:
    stmt = select(WatchlistItem).where(
        WatchlistItem.user_id == user_id, WatchlistItem.movie_id == movie_id
    )
    return session.exec(stmt).first()


# ── Follow CRUD ──────────────────────────────────────────────────────────────


def create_follow(
    *, session: Session, follower_id: uuid.UUID, following_id: uuid.UUID
) -> Follow:
    follow = Follow(follower_id=follower_id, following_id=following_id)
    session.add(follow)
    session.commit()
    session.refresh(follow)
    return follow


def get_follow(
    *, session: Session, follower_id: uuid.UUID, following_id: uuid.UUID
) -> Follow | None:
    stmt = select(Follow).where(
        Follow.follower_id == follower_id, Follow.following_id == following_id
    )
    return session.exec(stmt).first()


def get_pending_follow_requests(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50
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
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50
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
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50
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
    """Get all user IDs that the given user follows (accepted only)."""
    stmt = select(Follow.following_id).where(
        Follow.follower_id == user_id, Follow.status == FollowStatus.accepted
    )
    return list(session.exec(stmt).all())
