import uuid
from datetime import datetime

from pydantic import EmailStr, field_validator
from sqlmodel import Field, SQLModel

from app.collections.schemas import CollectionItemPublic


class UserBase(SQLModel):
    email: EmailStr = Field(max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=30)


class UserCreate(UserBase):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    username: str = Field(min_length=3, max_length=30)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, min_length=3, max_length=30)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str | None) -> str | None:
        if v is None:
            return v
        import re
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserPublic(SQLModel):
    id: uuid.UUID
    username: str
    full_name: str | None = None
    created_at: datetime | None = None


class UserMe(UserPublic):
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class UserProfile(SQLModel):
    user: UserPublic
    watched_count: int
    average_rating: float | None
    watched_media: list[CollectionItemPublic]
    watchlist: list[CollectionItemPublic]


class Message(SQLModel):
    message: str


__all__ = [
    "Message",
    "UpdatePassword",
    "UserCreate",
    "UserMe",
    "UserProfile",
    "UserPublic",
    "UserRegister",
    "UsersPublic",
    "UserUpdate",
    "UserUpdateMe",
    "CollectionItemPublic",
]
