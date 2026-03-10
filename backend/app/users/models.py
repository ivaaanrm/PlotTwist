import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.collections.models import CollectionItem


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=30)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    collection_items: list["CollectionItem"] = Relationship(
        back_populates="user", cascade_delete=True
    )
