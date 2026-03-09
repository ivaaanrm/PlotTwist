import uuid
from typing import Annotated

from fastapi import Depends

from app.auth.dependencies import CurrentUser, SessionDep
from app.users.follows import service as follows_service
from app.users.follows.exceptions import (
    FollowPermissionError,
    FollowRequestNotFoundError,
    FollowRequestNotPendingError,
)
from app.users.follows.models import Follow, FollowStatus


def get_follow_or_404(follow_id: uuid.UUID, session: SessionDep) -> Follow:
    follow = follows_service.get_follow_by_id(session=session, follow_id=follow_id)
    if not follow:
        raise FollowRequestNotFoundError()
    return follow


FollowByIdDep = Annotated[Follow, Depends(get_follow_or_404)]


def get_pending_follow_request_for_current_user(
    follow: FollowByIdDep,
    current_user: CurrentUser,
) -> Follow:
    if follow.following_id != current_user.id:
        raise FollowPermissionError()
    if follow.status != FollowStatus.pending:
        raise FollowRequestNotPendingError()
    return follow


PendingFollowRequestDep = Annotated[
    Follow,
    Depends(get_pending_follow_request_for_current_user),
]
