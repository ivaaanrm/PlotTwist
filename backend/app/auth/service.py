from datetime import timedelta

from fastapi import HTTPException
from sqlmodel import Session

from app.auth.utils import (
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.notifications.email.service import send_email
from app.notifications.email.utils import generate_reset_password_email
from app.config import settings
from app.core import security
from app.users import service as users_service
from app.users.schemas import UserUpdate

DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str):
    user = users_service.get_user_by_email(session=session, email=email)
    if not user:
        security.verify_password(password, DUMMY_HASH)
        return None

    verified, updated_password_hash = security.verify_password(
        password, user.hashed_password
    )
    if not verified:
        return None

    if updated_password_hash:
        user.hashed_password = updated_password_hash
        session.add(user)
        session.commit()
        session.refresh(user)

    return user


def build_access_token(user_id: str) -> str:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return security.create_access_token(user_id, expires_delta=access_token_expires)


def send_password_recovery_email(*, session: Session, email: str) -> None:
    user = users_service.get_user_by_email(session=session, email=email)
    if not user:
        return
    if not settings.emails_enabled:
        return

    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email,
        email=email,
        token=password_reset_token,
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )


def reset_password(*, session: Session, token: str, new_password: str) -> None:
    email = verify_password_reset_token(token=token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = users_service.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    users_service.update_user(
        session=session,
        db_user=user,
        user_in=UserUpdate(password=new_password),
    )
