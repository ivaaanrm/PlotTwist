"""CLI script to create a user directly in the database.

Usage:
    python -m scripts.create_user --email user@example.com --password secret123 --full-name "John Doe"

Replaces the old /api/v1/private/users/ dev-only endpoint.
"""

import argparse

from sqlmodel import Session

from app.core.security import get_password_hash
from app.database import engine
from app.users.models import User


def create_user(
    *,
    email: str,
    password: str,
    full_name: str = "",
    is_superuser: bool = False,
) -> None:
    with Session(engine) as session:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_superuser=is_superuser,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Created user: {user.email} (id={user.id})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a user in the database")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--password", required=True, help="User password")
    parser.add_argument("--full-name", default="", help="Full name")
    parser.add_argument(
        "--superuser", action="store_true", help="Make the user a superuser"
    )

    args = parser.parse_args()
    create_user(
        email=args.email,
        password=args.password,
        full_name=args.full_name,
        is_superuser=args.superuser,
    )
