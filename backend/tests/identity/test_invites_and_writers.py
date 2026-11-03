import re
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import httpx
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.identity import Role
from app.modules.identity.models import WriterInvite
from app.shared.audit import AuditLog
from app.shared.email import FakeEmail
from tests.factories import DEFAULT_PASSWORD, TestUser

API = "/api/v1"


def _last_token(container: Container) -> str:
    assert isinstance(container.email, FakeEmail)
    match = re.search(r"token=([\w-]+)", container.email.outbox[-1].text)
    assert match
    return match.group(1)


def _invite(client: TestClient, admin: TestUser, email: str = "writer@example.com") -> dict:
    response = client.post(f"{API}/admin/invites", json={"email": email}, headers=admin.headers)
    assert response.status_code == 201, response.text
    return response.json()


def _accept(client: TestClient, token: str) -> httpx.Response:
    return client.post(
        f"{API}/auth/accept-invite",
        json={"token": token, "password": "writer-password", "display_name": "Writer"},
    )


def _actions(db: Session) -> list[str]:
    return list(db.scalars(select(AuditLog.action).order_by(AuditLog.created_at)))


def test_invite_accept_once(
    client: TestClient, container: Container, make: Callable[..., TestUser], db: Session
) -> None:
    admin = make(Role.ADMIN)
    invite = _invite(client, admin)
    assert invite["status"] == "pending"
    token = _last_token(container)

    accepted = _accept(client, token)
    assert accepted.status_code == 200
    assert accepted.json()["user"]["role"] == "writer"
    again = _accept(client, token)
    assert again.status_code == 422
    assert again.json()["error"]["code"] == "invalid_invite"
    assert _actions(db) == ["invite.create", "invite.accept"]

    listed = client.get(f"{API}/admin/invites?status=accepted", headers=admin.headers).json()
    assert [i["email"] for i in listed["items"]] == ["writer@example.com"]


def test_expired_and_revoked_invites_rejected(
    client: TestClient, container: Container, make: Callable[..., TestUser], db: Session
) -> None:
    admin = make(Role.ADMIN)
    expired = _invite(client, admin, "late@example.com")
    expired_token = _last_token(container)
    row = db.get(WriterInvite, expired["id"])
    assert row
    row.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    assert _accept(client, expired_token).status_code == 422

    revoked = _invite(client, admin, "gone@example.com")
    revoked_token = _last_token(container)
    response = client.delete(f"{API}/admin/invites/{revoked['id']}", headers=admin.headers)
    assert response.json()["status"] == "revoked"
    assert _accept(client, revoked_token).status_code == 422
    assert "invite.revoke" in _actions(db)


def test_resend_replaces_token(
    client: TestClient, container: Container, make: Callable[..., TestUser], db: Session
) -> None:
    admin = make(Role.ADMIN)
    invite = _invite(client, admin)
    old_token = _last_token(container)
    resent = client.post(f"{API}/admin/invites/{invite['id']}/resend", headers=admin.headers)
    assert resent.status_code == 200
    new_token = _last_token(container)
    assert new_token != old_token
    assert _accept(client, old_token).status_code == 422
    assert _accept(client, new_token).status_code == 200
    assert "invite.resend" in _actions(db)


def test_cannot_invite_existing_writer(client: TestClient, make: Callable[..., TestUser]) -> None:
    admin = make(Role.ADMIN)
    make(Role.WRITER, email="taken@example.com")
    response = client.post(
        f"{API}/admin/invites", json={"email": "taken@example.com"}, headers=admin.headers
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "already_writer"


def test_deactivate_and_reactivate_writer(
    client: TestClient, make: Callable[..., TestUser], db: Session
) -> None:
    admin = make(Role.ADMIN)
    writer = make(Role.WRITER, email="w@example.com")
    login = client.post(
        f"{API}/auth/login", json={"email": "w@example.com", "password": DEFAULT_PASSWORD}
    ).json()

    response = client.post(f"{API}/admin/writers/{writer.id}/deactivate", headers=admin.headers)
    assert response.json()["status"] == "deactivated"

    me = client.get(f"{API}/me", headers=writer.headers)
    assert me.status_code == 401
    assert me.json()["error"]["code"] == "account_deactivated"
    refresh = client.post(f"{API}/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert refresh.status_code == 401
    relogin = client.post(
        f"{API}/auth/login", json={"email": "w@example.com", "password": DEFAULT_PASSWORD}
    )
    assert relogin.status_code == 403

    client.post(f"{API}/admin/writers/{writer.id}/reactivate", headers=admin.headers)
    assert client.get(f"{API}/me", headers=writer.headers).status_code == 200
    assert _actions(db) == ["writer.deactivate", "writer.reactivate"]

    listed = client.get(f"{API}/admin/writers", headers=admin.headers).json()
    assert listed["total"] == 1 and listed["items"][0]["email"] == "w@example.com"


def test_deactivate_rejects_non_writers(client: TestClient, make: Callable[..., TestUser]) -> None:
    admin = make(Role.ADMIN)
    listener = make(Role.LISTENER)
    response = client.post(f"{API}/admin/writers/{listener.id}/deactivate", headers=admin.headers)
    assert response.status_code == 404
