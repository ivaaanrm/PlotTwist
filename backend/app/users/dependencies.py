import uuid
from typing import Annotated

from fastapi import Depends, HTTPException

from app.auth.dependencies import CurrentUser, SessionDep
from app.follows import service as follows_service
from app.follows.models import FollowStatus
from app.users import service as users_service
from app.users.models import User


def get_user_or_404(user_id: uuid.UUID, session: SessionDep) -> User:
    user = users_service.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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
        raise HTTPException(
            status_code=403,
            detail="You must follow this user to view their profile",
        )
    return user


VisibleProfileUserDep = Annotated[User, Depends(get_visible_profile_user)]
