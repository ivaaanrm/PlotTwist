from sqlmodel import SQLModel

from app.follows.models import Follow
from app.media.models import Media
from app.users.models import User
from app.watched.models import WatchedMedia
from app.watchlist.models import WatchlistItem

__all__ = [
    "SQLModel",
    "User",
    "Media",
    "WatchedMedia",
    "WatchlistItem",
    "Follow",
]

