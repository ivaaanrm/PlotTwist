import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.crud import (
    create_follow,
    get_follow,
    get_followers,
    get_following,
    get_pending_follow_requests,
)
from app.models import (
    Follow,
    FollowPublic,
    FollowsPublic,
    FollowStatus,
    FollowUpdate,
    Message,
    User,
    get_datetime_utc,
)

router = APIRouter(prefix="/follows", tags=["follows"])


@router.post("/{user_id}", response_model=FollowPublic)
def send_follow_request(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Send a follow request to a user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = get_follow(
        session=session, follower_id=current_user.id, following_id=user_id
    )
    if existing:
        if existing.status == FollowStatus.accepted:
            raise HTTPException(status_code=400, detail="Already following this user")
        if existing.status == FollowStatus.pending:
            raise HTTPException(status_code=400, detail="Follow request already pending")
        if existing.status == FollowStatus.declined:
            # Allow re-requesting after decline
            existing.status = FollowStatus.pending
            existing.updated_at = get_datetime_utc()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    follow = create_follow(
        session=session, follower_id=current_user.id, following_id=user_id
    )
    return follow


@router.get("/requests", response_model=FollowsPublic)
def list_follow_requests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """List pending follow requests received by the current user."""
    items, count = get_pending_follow_requests(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return FollowsPublic(data=items, count=count)


@router.patch("/{follow_id}", response_model=FollowPublic)
def respond_to_follow_request(
    follow_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    follow_in: FollowUpdate,
) -> Any:
    """Accept or decline a follow request."""
    follow = session.get(Follow, follow_id)
    if not follow:
        raise HTTPException(status_code=404, detail="Follow request not found")
    if follow.following_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if follow.status != FollowStatus.pending:
        raise HTTPException(status_code=400, detail="Follow request is not pending")
    if follow_in.status not in (FollowStatus.accepted, FollowStatus.declined):
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'declined'")

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
    """Unfollow a user or cancel a pending follow request."""
    follow = get_follow(
        session=session, follower_id=current_user.id, following_id=user_id
    )
    if not follow:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
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
    """List current user's followers (accepted only)."""
    items, count = get_followers(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return FollowsPublic(data=items, count=count)


@router.get("/following", response_model=FollowsPublic)
def list_following(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """List users the current user follows (accepted only)."""
    items, count = get_following(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return FollowsPublic(data=items, count=count)
