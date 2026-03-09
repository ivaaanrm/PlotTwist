import uuid
from typing import Annotated

from fastapi import Depends

from app.auth.dependencies import CurrentUser, SessionDep
from app.users import service as users_service
from app.users.exceptions import ProfileNotVisibleError, UserNotFoundError
from app.users.follows import service as follows_service
from app.users.follows.models import FollowStatus
from app.users.models import User


def get_user_or_404(user_id: uuid.UUID, session: SessionDep) -> User:
    user = users_service.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise UserNotFoundError()
    return user


UserByIdDep = Annotated[User, Depends(get_user_or_404)]


def get_visible_profile_user(
    user: UserByIdDep,
    session: SessionDep,
    current_user: CurrentUser,
) -> User:
    if user.id == current_user.id or current_user.is_superuser:
        return user

    follow = follows_service.get_follow(
        session=session,
        follower_id=current_user.id,
        following_id=user.id,
    )
    if not follow or follow.status != FollowStatus.accepted:
        raise ProfileNotVisibleError()
    return user


VisibleProfileUserDep = Annotated[User, Depends(get_visible_profile_user)]
