from sqlmodel import Field, SQLModel

from app.users.schemas import UserPublic


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


__all__ = [
    "Message",
    "NewPassword",
    "Token",
    "TokenPayload",
    "UserPublic",
]
