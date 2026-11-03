"""Helpers to create users and auth headers in tests."""

import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.container import Container
from app.modules.identity.models import Role, User
from app.modules.identity.security import create_access_token, hash_password

DEFAULT_PASSWORD = "password-123"


@dataclass
class TestUser:
    __test__ = False  # not a pytest test class

    id: uuid.UUID
    user: User
    headers: dict[str, str]


def make_user(
    db: Session,
    container: Container,
    role: Role = Role.LISTENER,
    email: str | None = None,
    password: str = DEFAULT_PASSWORD,
) -> TestUser:
    count = db.query(User).count()
    user = User(
        email=email or f"{role.value}{count}@example.com",
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    token = create_access_token(
        user.id, role.value, secret=container.settings.secret_key, ttl_minutes=15
    )
    return TestUser(id=user.id, user=user, headers={"Authorization": f"Bearer {token}"})
