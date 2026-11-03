"""Password hashing (argon2id), JWT access tokens and opaque one-time tokens."""

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.shared.errors import Unauthorized

_hasher = PasswordHasher()
_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        # Spend similar time as a real check so missing accounts are not detectable by timing.
        _hasher.hash(password)
        return False
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def new_opaque_token() -> str:
    """Random URL-safe token for refresh tokens and invites (only its hash is stored)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@dataclass(frozen=True)
class AccessClaims:
    user_id: uuid.UUID
    role: str


def create_access_token(
    user_id: uuid.UUID, role: str, *, secret: str, ttl_minutes: int, now: datetime | None = None
) -> str:
    issued = now or datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": issued,
        "exp": issued + timedelta(minutes=ttl_minutes),
    }
    return jwt.encode(payload, secret, algorithm=_ALGORITHM)


def decode_access_token(token: str, *, secret: str) -> AccessClaims:
    try:
        payload = jwt.decode(token, secret, algorithms=[_ALGORITHM], options={"require": ["exp"]})
    except jwt.ExpiredSignatureError as exc:
        raise Unauthorized("Access token expired", code="token_expired") from exc
    except jwt.PyJWTError as exc:
        raise Unauthorized("Invalid access token", code="invalid_token") from exc
    if payload.get("type") != "access":
        raise Unauthorized("Invalid access token", code="invalid_token")
    try:
        return AccessClaims(user_id=uuid.UUID(payload["sub"]), role=str(payload["role"]))
    except (KeyError, ValueError) as exc:
        raise Unauthorized("Invalid access token", code="invalid_token") from exc
