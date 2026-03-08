import uuid
from typing import Annotated

from fastapi import Depends, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.watched.models import WatchedMedia


def get_owned_watched_media(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> WatchedMedia:
    watched = session.get(WatchedMedia, id)
    if not watched:
        raise HTTPException(status_code=404, detail="Watched item not found")
    if watched.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return watched


OwnedWatchedMediaDep = Annotated[WatchedMedia, Depends(get_owned_watched_media)]
