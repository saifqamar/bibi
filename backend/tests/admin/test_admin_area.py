"""Admin-only endpoints: route sweep, audit log, writer stats and per-episode access."""

import re
import uuid
from collections.abc import Callable

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.identity import Role
from app.shared.audit import record_audit
from tests.factories import TestUser

ADMIN = "/api/v1/admin"
STUDIO = "/api/v1/studio"


def admin_routes(app: FastAPI) -> list[tuple[str, str]]:
    routes = []
    for path, methods in app.openapi()["paths"].items():
        if path.startswith(ADMIN):
            concrete = re.sub(r"\{[^}]+\}", str(uuid.uuid4()), path)
            routes += [(method.upper(), concrete) for method in methods]
    return routes


def test_every_admin_route_rejects_writers_and_listeners(
    app: FastAPI, client: TestClient, make: Callable[..., TestUser]
) -> None:
    routes = admin_routes(app)
    assert len(routes) > 25  # the sweep really covers the admin surface
    for user in (make(Role.WRITER), make(Role.LISTENER)):
        for method, path in routes:
            response = client.request(method, path, headers=user.headers, json={})
            assert response.status_code == 403, (method, path, user.user.role)
    for method, path in routes:
        assert client.request(method, path, json={}).status_code == 401, (method, path)


def test_admin_sees_all_series_writer_only_own(
    client: TestClient, make: Callable[..., TestUser]
) -> None:
    writer_a, writer_b, admin = make(Role.WRITER), make(Role.WRITER), make(Role.ADMIN)
    for writer, title in [(writer_a, "A1"), (writer_a, "A2"), (writer_b, "B1")]:
        client.post(
            f"{STUDIO}/series",
            json={"title": title, "language": "en", "themes": []},
            headers=writer.headers,
        )
    assert client.get(f"{ADMIN}/series", headers=admin.headers).json()["total"] == 3
    assert client.get(f"{STUDIO}/series", headers=writer_b.headers).json()["total"] == 1
    counts = client.get(f"{ADMIN}/writer-series-counts", headers=admin.headers).json()
    assert counts == {str(writer_a.id): 2, str(writer_b.id): 1}


def test_audit_log_filters(client: TestClient, make: Callable[..., TestUser], db: Session) -> None:
    admin, writer = make(Role.ADMIN), make(Role.WRITER)
    record_audit(
        db,
        actor_id=writer.id,
        action="series.create",
        entity_type="series",
        entity_id="s1",
        metadata={"title": "X"},
    )
    record_audit(db, actor_id=admin.id, action="shelf.create", entity_type="shelf", entity_id="sh1")
    db.commit()
    everything = client.get(f"{ADMIN}/audit-log", headers=admin.headers).json()
    assert everything["total"] == 2
    by_actor = client.get(f"{ADMIN}/audit-log?actor_id={writer.id}", headers=admin.headers).json()
    assert [e["action"] for e in by_actor["items"]] == ["series.create"]
    assert by_actor["items"][0]["metadata"] == {"title": "X"}
    by_entity = client.get(
        f"{ADMIN}/audit-log?entity_type=shelf&entity_id=sh1", headers=admin.headers
    ).json()
    assert [e["action"] for e in by_entity["items"]] == ["shelf.create"]
    future = client.get(f"{ADMIN}/audit-log?from=2099-01-01", headers=admin.headers).json()
    assert future["total"] == 0


def test_episode_access_override(client: TestClient, make: Callable[..., TestUser]) -> None:
    admin, writer = make(Role.ADMIN), make(Role.WRITER)
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "S", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={}, headers=writer.headers
    ).json()
    for value in (False, True, None):
        response = client.put(
            f"{ADMIN}/episodes/{episode['id']}/access",
            json={"is_free": value},
            headers=admin.headers,
        )
        assert response.json()["is_free"] is value
    detail = client.get(f"{STUDIO}/episodes/{episode['id']}", headers=writer.headers).json()
    assert detail["is_free"] is None
    audit = client.get(f"{ADMIN}/audit-log?entity_type=episode", headers=admin.headers).json()
    changes = [e["metadata"]["is_free"] for e in audit["items"] if e["action"] == "episode.access"]
    assert changes == [None, True, False]
    missing = client.put(
        f"{ADMIN}/episodes/{uuid.uuid4()}/access", json={"is_free": True}, headers=admin.headers
    )
    assert missing.status_code == 404


@pytest.mark.parametrize("path", ["/audit-log", "/writer-series-counts"])
def test_admin_reads_need_admin(
    client: TestClient, make: Callable[..., TestUser], path: str
) -> None:
    assert client.get(ADMIN + path, headers=make(Role.ADMIN).headers).status_code == 200
