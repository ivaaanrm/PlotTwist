from sqlmodel import Session, SQLModel, create_engine, select

from app import models  # noqa: F401
from app.config import settings
from app.models import User
from app.users import service as users_service
from app.users.schemas import UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


def init_db(session: Session) -> None:
    # Ensure all SQLModel tables exist when running without Alembic migrations
    SQLModel.metadata.create_all(bind=engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = users_service.create_user(session=session, user_create=user_in)
