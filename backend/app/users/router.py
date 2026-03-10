import uuid
from typing import Any

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, SessionDep, get_current_active_superuser
from app.collections import service as collections_service
from app.collections.adapters import SqlCollectionAdapter
from app.core.security import get_password_hash, verify_password
from app.notifications.email.config import email_settings
from app.notifications.email.service import send_email
from app.notifications.email.utils import generate_new_account_email
from app.users import dependencies as users_dependencies
from app.users import service as users_service
from app.users.exceptions import (
    IncorrectPasswordError,
    SamePasswordError,
    SuperUserDeletionError,
    UserEmailExistsError,
    UserNotFoundError,
)
from app.users.schemas import (
    CollectionItemPublic,
    Message,
    UpdatePassword,
    UserCreate,
    UserProfile,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    users, count = users_service.list_users(session=session, skip=skip, limit=limit)
    return UsersPublic(data=users, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    existing = users_service.get_user_by_email(session=session, email=user_in.email)
    if existing:
        raise UserEmailExistsError()

    user = users_service.create_user(session=session, user_create=user_in)
    if email_settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email,
            username=user_in.email,
            password=user_in.password,
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *,
    session: SessionDep,
    user_in: UserUpdateMe,
    current_user: CurrentUser,
) -> Any:
    if user_in.email:
        existing_user = users_service.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != current_user.id:
            raise UserEmailExistsError()

    current_user.sqlmodel_update(user_in.model_dump(exclude_unset=True))
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *,
    session: SessionDep,
    body: UpdatePassword,
    current_user: CurrentUser,
) -> Any:
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise IncorrectPasswordError()
    if body.current_password == body.new_password:
        raise SamePasswordError()

    current_user.hashed_password = get_password_hash(body.new_password)
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    if current_user.is_superuser:
        raise SuperUserDeletionError()
    users_service.delete_user(session=session, user=current_user)
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    existing = users_service.get_user_by_email(session=session, email=user_in.email)
    if existing:
        raise UserEmailExistsError()

    user_create = UserCreate.model_validate(user_in)
    user = users_service.create_user(session=session, user_create=user_create)
    return user


@router.get("/search", response_model=UsersPublic)
def search_users(
    session: SessionDep,
    current_user: CurrentUser,
    query: str = "",
    skip: int = 0,
    limit: int = 20,
) -> Any:
    users, count = users_service.search_users(
        session=session,
        current_user_id=current_user.id,
        query=query,
        skip=skip,
        limit=limit,
    )
    return UsersPublic(data=users, count=count)


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    user = users_service.get_user_by_id(session=session, user_id=user_id)
    if user is None:
        raise UserNotFoundError()
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    db_user = users_service.get_user_by_id(session=session, user_id=user_id)
    if not db_user:
        raise UserNotFoundError()

    if user_in.email:
        existing_user = users_service.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != user_id:
            raise UserEmailExistsError()

    return users_service.update_user(session=session, db_user=db_user, user_in=user_in)


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
) -> Message:
    user = users_service.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise UserNotFoundError()
    if user == current_user:
        raise SuperUserDeletionError()

    users_service.delete_user(session=session, user=user)
    return Message(message="User deleted successfully")


@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(
    profile_user: users_dependencies.VisibleProfileUserDep,
    session: SessionDep,
) -> Any:
    adapter = SqlCollectionAdapter(session)
    watched_items, watched_count = collections_service.get_collection_items(
        adapter=adapter,
        user_id=profile_user.id,
        collection_name="watched",
        skip=0,
        limit=100,
    )
    watchlist_items, _ = collections_service.get_collection_items(
        adapter=adapter,
        user_id=profile_user.id,
        collection_name="watchlist",
        skip=0,
        limit=100,
    )

    ratings = [item.rating for item in watched_items if item.rating is not None]
    avg_rating = sum(ratings) / len(ratings) if ratings else None

    return UserProfile(
        user=UserPublic.model_validate(profile_user),
        watched_count=watched_count,
        average_rating=avg_rating,
        watched_media=[
            CollectionItemPublic.model_validate(item) for item in watched_items
        ],
        watchlist=[
            CollectionItemPublic.model_validate(item) for item in watchlist_items
        ],
    )
