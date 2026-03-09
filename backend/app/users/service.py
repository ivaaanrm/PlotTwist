import uuid
from typing import Any

from sqlalchemy import or_
from sqlmodel import Session, col, func, select

from app.core.security import get_password_hash
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> User:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data: dict[str, Any] = {}
    if "password" in user_data:
        password = user_data["password"]
        extra_data["hashed_password"] = get_password_hash(password)
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_user_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
    return session.get(User, user_id)


def list_users(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[User], int]:
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = (
        select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    users = session.exec(statement).all()
    return list(users), count


def search_users(
    *,
    session: Session,
    current_user_id: uuid.UUID,
    query: str = "",
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[User], int]:
    statement = select(User).where(User.id != current_user_id)
    trimmed_query = query.strip()
    if trimmed_query:
        like_pattern = f"%{trimmed_query}%"
        statement = statement.where(
            or_(User.email.ilike(like_pattern), User.full_name.ilike(like_pattern))
        )

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    users_statement = (
        statement.order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    users = session.exec(users_statement).all()
    return list(users), count


def delete_user(*, session: Session, user: User) -> None:
    session.delete(user)
    session.commit()
