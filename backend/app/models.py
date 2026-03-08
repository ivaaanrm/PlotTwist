import uuid
from datetime import date, datetime, timezone
from enum import Enum

from pydantic import EmailStr, field_validator
from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# ── User Models ──────────────────────────────────────────────────────────────


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    watched_movies: list["WatchedMovie"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    watchlist_items: list["WatchlistItem"] = Relationship(
        back_populates="user", cascade_delete=True
    )


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ── Movie Models ─────────────────────────────────────────────────────────────


class MovieBase(SQLModel):
    tmdb_id: int = Field(unique=True, index=True)
    title: str = Field(max_length=255)
    overview: str | None = Field(default=None, max_length=2000)
    poster_path: str | None = Field(default=None, max_length=255)
    backdrop_path: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    tmdb_rating: float | None = None
    genres: str | None = Field(default=None, max_length=500)


class Movie(MovieBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class MoviePublic(MovieBase):
    id: uuid.UUID
    created_at: datetime | None = None


class MoviesPublic(SQLModel):
    data: list[MoviePublic]
    count: int


# ── WatchedMovie Models ─────────────────────────────────────────────────────


class WatchedMovieBase(SQLModel):
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError("Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)")
        return v


class WatchedMovieCreate(SQLModel):
    tmdb_id: int
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError("Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)")
        return v


class WatchedMovieUpdate(SQLModel):
    rating: float | None = Field(default=None, ge=0.5, le=5.0)

    @field_validator("rating")
    @classmethod
    def rating_must_be_half_step(cls, v: float | None) -> float | None:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError("Rating must be in 0.5 increments (0.5, 1.0, 1.5, ..., 5.0)")
        return v


class WatchedMovie(WatchedMovieBase, table=True):
    __table_args__ = (UniqueConstraint("user_id", "movie_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    movie_id: uuid.UUID = Field(foreign_key="movie.id", nullable=False, ondelete="CASCADE")
    watched_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user: User | None = Relationship(back_populates="watched_movies")
    movie: Movie | None = Relationship()


class WatchedMoviePublic(WatchedMovieBase):
    id: uuid.UUID
    user_id: uuid.UUID
    movie_id: uuid.UUID
    watched_at: datetime | None = None
    movie: MoviePublic | None = None


class WatchedMoviesPublic(SQLModel):
    data: list[WatchedMoviePublic]
    count: int


# ── WatchlistItem Models ────────────────────────────────────────────────────


class WatchlistItemCreate(SQLModel):
    tmdb_id: int


class WatchlistItem(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "movie_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    movie_id: uuid.UUID = Field(foreign_key="movie.id", nullable=False, ondelete="CASCADE")
    added_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user: User | None = Relationship(back_populates="watchlist_items")
    movie: Movie | None = Relationship()


class WatchlistItemPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    movie_id: uuid.UUID
    added_at: datetime | None = None
    movie: MoviePublic | None = None


class WatchlistItemsPublic(SQLModel):
    data: list[WatchlistItemPublic]
    count: int


# ── Follow Models ────────────────────────────────────────────────────────────


class FollowStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Follow(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("follower_id", "following_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    follower_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    following_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    status: FollowStatus = Field(default=FollowStatus.pending)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class FollowUpdate(SQLModel):
    status: FollowStatus


class FollowPublic(SQLModel):
    id: uuid.UUID
    follower_id: uuid.UUID
    following_id: uuid.UUID
    status: FollowStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FollowsPublic(SQLModel):
    data: list[FollowPublic]
    count: int


# ── User Profile Models ─────────────────────────────────────────────────────


class UserProfile(SQLModel):
    user: UserPublic
    watched_count: int
    average_rating: float | None
    watched_movies: list[WatchedMoviePublic]
    watchlist: list[WatchlistItemPublic]


# ── Feed Models ──────────────────────────────────────────────────────────────


class FeedItem(SQLModel):
    user: UserPublic
    watched_movie: WatchedMoviePublic


class FeedPublic(SQLModel):
    data: list[FeedItem]
    count: int


# ── Auth / Utility Models ───────────────────────────────────────────────────


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
