"""Global model exports for compatibility and Alembic discovery."""

from sqlmodel import SQLModel

from app.auth.schemas import Message, NewPassword, Token, TokenPayload
from app.feed.models import FeedItem, FeedPublic
from app.follows.models import Follow, FollowStatus, get_datetime_utc
from app.follows.schemas import (
    FollowPublic,
    FollowRequestPublic,
    FollowRequestsPublic,
    FollowsPublic,
    FollowUpdate,
)
from app.media.models import Media, MediaType
from app.media.schemas import MediaPublic
from app.users.models import User
from app.users.schemas import (
    UpdatePassword,
    UserCreate,
    UserProfile,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.watched.models import WatchedMedia
from app.watched.schemas import (
    WatchedMediaCreate,
    WatchedMediaListPublic,
    WatchedMediaPublic,
    WatchedMediaUpdate,
)
from app.watchlist.models import WatchlistItem
from app.watchlist.schemas import (
    WatchlistItemCreate,
    WatchlistItemPublic,
    WatchlistItemsPublic,
)

Movie = Media
MoviePublic = MediaPublic
WatchedMoviePublic = WatchedMediaPublic

__all__ = [
    "FeedItem",
    "FeedPublic",
    "Follow",
    "FollowPublic",
    "FollowRequestPublic",
    "FollowRequestsPublic",
    "FollowsPublic",
    "FollowStatus",
    "FollowUpdate",
    "Media",
    "MediaPublic",
    "MediaType",
    "Message",
    "Movie",
    "MoviePublic",
    "NewPassword",
    "SQLModel",
    "Token",
    "TokenPayload",
    "UpdatePassword",
    "User",
    "UserCreate",
    "UserProfile",
    "UserPublic",
    "UserRegister",
    "UsersPublic",
    "UserUpdate",
    "UserUpdateMe",
    "WatchedMedia",
    "WatchedMediaCreate",
    "WatchedMediaListPublic",
    "WatchedMediaPublic",
    "WatchedMediaUpdate",
    "WatchedMoviePublic",
    "WatchlistItem",
    "WatchlistItemCreate",
    "WatchlistItemPublic",
    "WatchlistItemsPublic",
    "get_datetime_utc",
]
