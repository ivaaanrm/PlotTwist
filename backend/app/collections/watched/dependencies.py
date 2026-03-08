import uuid
from typing import Annotated

from fastapi import Depends

from app.auth.dependencies import CurrentUser, SessionDep
from app.collections.watched.exceptions import (
    WatchedItemNotFoundError,
    WatchedPermissionError,
)
from app.collections.watched.models import WatchedMedia


def get_owned_watched_media(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> WatchedMedia:
    watched = session.get(WatchedMedia, id)
    if not watched:
        raise WatchedItemNotFoundError()
    if watched.user_id != current_user.id:
        raise WatchedPermissionError()
    return watched


OwnedWatchedMediaDep = Annotated[WatchedMedia, Depends(get_owned_watched_media)]
