import uuid
from datetime import UTC, datetime, timedelta

import pytest

from app.modules.identity.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_token,
    new_opaque_token,
    verify_password,
)
from app.shared.errors import Unauthorized

SECRET = "unit-test-secret-that-is-long-enough-0123"


def test_password_hashing() -> None:
    hashed = hash_password("correct horse")
    assert hashed.startswith("$argon2id$")
    assert verify_password("correct horse", hashed)
    assert not verify_password("wrong", hashed)
    assert not verify_password("anything", None)
    assert not verify_password("anything", "not-a-hash")


def test_access_token_round_trip() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "writer", secret=SECRET, ttl_minutes=5)
    claims = decode_access_token(token, secret=SECRET)
    assert claims.user_id == user_id
    assert claims.role == "writer"


def test_access_token_rejections() -> None:
    token = create_access_token(uuid.uuid4(), "writer", secret=SECRET, ttl_minutes=5)
    with pytest.raises(Unauthorized) as wrong_secret:
        decode_access_token(token, secret=SECRET + "-other")
    assert wrong_secret.value.code == "invalid_token"

    old = create_access_token(
        uuid.uuid4(),
        "writer",
        secret=SECRET,
        ttl_minutes=5,
        now=datetime.now(UTC) - timedelta(hours=1),
    )
    with pytest.raises(Unauthorized) as expired:
        decode_access_token(old, secret=SECRET)
    assert expired.value.code == "token_expired"


def test_opaque_tokens() -> None:
    a, b = new_opaque_token(), new_opaque_token()
    assert a != b and len(a) >= 40
    assert hash_token(a) == hash_token(a)
    assert len(hash_token(a)) == 64
