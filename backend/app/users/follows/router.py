import uuid
from typing import Any

from fastapi import APIRouter

from app.auth.dependencies import CurrentUser, SessionDep
from app.users import service as users_service
from app.users.exceptions import UserNotFoundError
from app.users.follows import dependencies as follows_dependencies
from app.users.follows import service as follows_service
from app.users.follows.exceptions import (
    AlreadyFollowingError,
    CannotFollowSelfError,
    FollowNotFoundError,
    FollowRequestPendingError,
    InvalidFollowStatusError,
)
from app.users.follows.models import get_datetime_utc
from app.users.follows.schemas import (
    FollowPublic,
    FollowRequestPublic,
    FollowRequestsPublic,
    FollowsPublic,
    FollowStatus,
    FollowUpdate,
    Message,
    UserPublic,
)

router = APIRouter(prefix="/follows", tags=["follows"])


@router.post("/{user_id}", response_model=FollowPublic)
def send_follow_request(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    if user_id == current_user.id:
        raise CannotFollowSelfError()

    target = users_service.get_user_by_id(session=session, user_id=user_id)
    if not target:
        raise UserNotFoundError()

    existing = follows_service.get_follow(
        session=session,
        follower_id=current_user.id,
        following_id=user_id,
    )
    if existing:
        if existing.status == FollowStatus.accepted:
            raise AlreadyFollowingError()
        if existing.status == FollowStatus.pending:
            raise FollowRequestPendingError()
        if existing.status == FollowStatus.declined:
            existing.status = FollowStatus.pending
            existing.updated_at = get_datetime_utc()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    return follows_service.create_follow(
        session=session,
        follower_id=current_user.id,
        following_id=user_id,
    )


@router.get("/requests", response_model=FollowRequestsPublic)
def list_follow_requests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = follows_service.get_pending_follow_requests(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    data: list[FollowRequestPublic] = []
    for follow in items:
        requester = users_service.get_user_by_id(
            session=session, user_id=follow.follower_id
        )
        if requester:
            data.append(
                FollowRequestPublic(
                    follow=FollowPublic.model_validate(follow),
                    requester=UserPublic.model_validate(requester),
                )
            )

    return FollowRequestsPublic(data=data, count=count)


@router.patch("/{follow_id}", response_model=FollowPublic)
def respond_to_follow_request(
    session: SessionDep,
    follow: follows_dependencies.PendingFollowRequestDep,
    follow_in: FollowUpdate,
) -> Any:
    if follow_in.status not in (FollowStatus.accepted, FollowStatus.declined):
        raise InvalidFollowStatusError()

    follow.status = follow_in.status
    follow.updated_at = get_datetime_utc()
    session.add(follow)
    session.commit()
    session.refresh(follow)
    return follow


@router.delete("/{user_id}")
def unfollow_or_cancel(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    follow = follows_service.get_follow(
        session=session,
        follower_id=current_user.id,
        following_id=user_id,
    )
    if not follow:
        raise FollowNotFoundError()

    session.delete(follow)
    session.commit()
    return Message(message="Unfollowed successfully")


@router.get("/followers", response_model=FollowsPublic)
def list_followers(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = follows_service.get_followers(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return FollowsPublic(data=items, count=count)


@router.get("/following", response_model=FollowsPublic)
def list_following(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    items, count = follows_service.get_following(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return FollowsPublic(data=items, count=count)
