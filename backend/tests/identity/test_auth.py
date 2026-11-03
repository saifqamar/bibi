from collections.abc import Callable

from fastapi import APIRouter, Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.identity import CurrentUser, Role, require_studio
from app.modules.identity.models import User
from tests.factories import DEFAULT_PASSWORD, TestUser

API = "/api/v1"


def signup(client: TestClient, email: str = "new@example.com", **extra: object) -> dict:
    response = client.post(
        f"{API}/auth/signup", json={"email": email, "password": "long-password", **extra}
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_signup_creates_listener_and_signs_in(client: TestClient) -> None:
    body = signup(client, "Mixed@Example.com", display_name="Ana")
    assert body["user"]["role"] == "listener"
    assert body["user"]["email"] == "mixed@example.com"
    me = client.get(f"{API}/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["display_name"] == "Ana"


def test_signup_cannot_choose_a_role(client: TestClient, db: Session) -> None:
    response = client.post(
        f"{API}/auth/signup",
        json={"email": "sneaky@example.com", "password": "long-password", "role": "writer"},
    )
    assert response.status_code == 422
    assert db.scalar(select(User).where(User.email == "sneaky@example.com")) is None


def test_signup_duplicate_email(client: TestClient) -> None:
    signup(client, "dup@example.com")
    response = client.post(
        f"{API}/auth/signup", json={"email": "DUP@example.com", "password": "long-password"}
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_in_use"


def test_login_and_wrong_password(client: TestClient, make: Callable[..., TestUser]) -> None:
    user = make(Role.WRITER, email="w@example.com")
    ok = client.post(
        f"{API}/auth/login", json={"email": "w@example.com", "password": DEFAULT_PASSWORD}
    )
    assert ok.status_code == 200
    assert ok.json()["user"]["id"] == str(user.id)
    bad = client.post(f"{API}/auth/login", json={"email": "w@example.com", "password": "nope-nope"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "invalid_credentials"
    missing = client.post(f"{API}/auth/login", json={"email": "x@example.com", "password": "nope"})
    assert missing.json()["error"]["code"] == "invalid_credentials"


def test_refresh_rotates_and_detects_reuse(client: TestClient) -> None:
    first = signup(client)
    second = client.post(f"{API}/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert second.status_code == 200
    new_refresh = second.json()["refresh_token"]
    assert new_refresh != first["refresh_token"]

    reuse = client.post(f"{API}/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert reuse.status_code == 401
    assert reuse.json()["error"]["code"] == "refresh_token_reused"
    # Reuse ends every session, including the newly rotated token.
    after = client.post(f"{API}/auth/refresh", json={"refresh_token": new_refresh})
    assert after.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient) -> None:
    tokens = signup(client)
    assert (
        client.post(
            f"{API}/auth/logout", json={"refresh_token": tokens["refresh_token"]}
        ).status_code
        == 204
    )
    response = client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 401


def test_me_requires_valid_token(client: TestClient) -> None:
    assert client.get(f"{API}/me").json()["error"]["code"] == "not_authenticated"
    bad = client.get(f"{API}/me", headers={"Authorization": "Bearer garbage"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "invalid_token"


def test_role_checks(app: FastAPI, make: Callable[..., TestUser]) -> None:
    router = APIRouter(prefix="/api/v1/studio")

    @router.get("/_probe")
    def probe(user: CurrentUser = Depends(require_studio)) -> dict[str, str]:
        return {"role": user.role}

    app.include_router(router)
    client = TestClient(app)
    listener, writer, admin = make(Role.LISTENER), make(Role.WRITER), make(Role.ADMIN)

    assert client.get("/api/v1/studio/_probe", headers=listener.headers).status_code == 403
    assert client.get("/api/v1/studio/_probe", headers=writer.headers).status_code == 200
    assert client.get("/api/v1/studio/_probe", headers=admin.headers).status_code == 200
    for user in (listener, writer):
        response = client.get(f"{API}/admin/writers", headers=user.headers)
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    assert client.get(f"{API}/admin/writers", headers=admin.headers).status_code == 200


def test_social_login_creates_and_links(client: TestClient, make: Callable[..., TestUser]) -> None:
    created = client.post(
        f"{API}/auth/social", json={"provider": "google", "id_token": "fake:g-1:new@example.com"}
    )
    assert created.status_code == 200
    assert created.json()["user"]["role"] == "listener"
    again = client.post(
        f"{API}/auth/social", json={"provider": "google", "id_token": "fake:g-1:new@example.com"}
    )
    assert again.json()["user"]["id"] == created.json()["user"]["id"]

    existing = make(Role.LISTENER, email="old@example.com")
    linked = client.post(
        f"{API}/auth/social", json={"provider": "apple", "id_token": "fake:a-9:old@example.com"}
    )
    assert linked.json()["user"]["id"] == str(existing.id)

    bad = client.post(f"{API}/auth/social", json={"provider": "google", "id_token": "forged"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "social_auth_failed"


def test_auth_rate_limit(client: TestClient) -> None:
    codes = [
        client.post(
            f"{API}/auth/login", json={"email": "a@example.com", "password": "x"}
        ).status_code
        for _ in range(11)
    ]
    assert codes[:10] == [401] * 10
    assert codes[10] == 429
