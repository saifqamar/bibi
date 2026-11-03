import uuid
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.cli import main as cli_main
from app.modules.identity import Role
from app.modules.identity.models import User
from app.shared.config import get_settings
from app.shared.events import subscribe
from tests.conftest import TEST_DATABASE_URL
from tests.factories import TestUser

API = "/api/v1"

deleted_ids: list[uuid.UUID] = []


@subscribe("user_deleted")
def _record_deletion(db: Session, user_id: uuid.UUID) -> None:
    deleted_ids.append(user_id)


def test_listener_can_delete_account(
    client: TestClient, make: Callable[..., TestUser], db: Session
) -> None:
    listener = make(Role.LISTENER)
    response = client.delete(f"{API}/me", headers=listener.headers)
    assert response.status_code == 204
    assert listener.id in deleted_ids
    db.expire_all()
    assert db.get(User, listener.id) is None
    assert client.get(f"{API}/me", headers=listener.headers).status_code == 401


def test_studio_accounts_cannot_self_delete(
    client: TestClient, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    response = client.delete(f"{API}/me", headers=writer.headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "account_deletion_not_allowed"


def test_create_admin_cli(monkeypatch: pytest.MonkeyPatch, db: Session) -> None:
    monkeypatch.setenv("BIBI_DATABASE_URL", TEST_DATABASE_URL)
    get_settings.cache_clear()
    try:
        assert (
            cli_main(["create-admin", "--email", "Root@Example.com", "--password", "pw-123456"])
            == 0
        )
        assert (
            cli_main(["create-admin", "--email", "root@example.com", "--password", "pw-123456"])
            == 1
        )
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()
    admin = db.query(User).filter_by(email="root@example.com").one()
    assert admin.role == Role.ADMIN
