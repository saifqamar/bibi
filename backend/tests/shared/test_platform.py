import time

import pytest
from fastapi import APIRouter, Depends, FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.shared.audit import AuditLog, record_audit
from app.shared.db import get_db
from app.shared.errors import Conflict
from app.shared.events import emit, subscribe
from app.shared.jobs import InMemoryJobQueue
from app.shared.pagination import Page, PageParams, make_page, page_params, paginate
from app.shared.ratelimit import rate_limit
from app.shared.storage import InMemoryStorage, LocalStorage


class Item(BaseModel):
    action: str


def _test_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1/_test")

    @router.get("/conflict")
    def conflict() -> None:
        raise Conflict("Already there", details={"field": "x"})

    @router.get("/boom")
    def boom() -> None:
        raise RuntimeError("kaput")

    @router.get("/validate")
    def validate(n: int) -> dict[str, int]:
        return {"n": n}

    @router.get("/limited", dependencies=[Depends(rate_limit("test", limit=2))])
    def limited() -> dict[str, bool]:
        return {"ok": True}

    @router.get("/audit", response_model=Page[Item])
    def audit_page(
        params: PageParams = Depends(page_params), db: Session = Depends(get_db)
    ) -> Page[Item]:
        rows, total = paginate(db, select(AuditLog).order_by(AuditLog.action), params)
        return make_page([Item(action=r.action) for r in rows], total, params)

    return router


@pytest.fixture
def test_client(app: FastAPI) -> TestClient:
    app.include_router(_test_router())
    return TestClient(app, raise_server_exceptions=False)


def test_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_request_id_is_generated_and_echoed(client: TestClient) -> None:
    generated = client.get("/api/v1/health").headers["x-request-id"]
    assert len(generated) == 32
    echoed = client.get("/api/v1/health", headers={"X-Request-ID": "abc-123"})
    assert echoed.headers["x-request-id"] == "abc-123"
    bad = client.get("/api/v1/health", headers={"X-Request-ID": "bad id with spaces"})
    assert bad.headers["x-request-id"] != "bad id with spaces"


def test_error_shapes(test_client: TestClient) -> None:
    not_found = test_client.get("/api/v1/nope", headers={"X-Request-ID": "rid-1"})
    assert not_found.status_code == 404
    assert not_found.json()["error"]["code"] == "not_found"
    assert not_found.json()["error"]["request_id"] == "rid-1"

    conflict = test_client.get("/api/v1/_test/conflict").json()["error"]
    assert conflict["code"] == "conflict"
    assert conflict["details"] == {"field": "x"}

    invalid = test_client.get("/api/v1/_test/validate?n=abc")
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "validation_error"
    assert invalid.json()["error"]["details"]["errors"][0]["loc"] == ["query", "n"]

    boom = test_client.get("/api/v1/_test/boom")
    assert boom.status_code == 500
    assert boom.json()["error"]["code"] == "internal_error"
    assert "kaput" not in boom.text


def test_rate_limit(test_client: TestClient) -> None:
    assert test_client.get("/api/v1/_test/limited").status_code == 200
    assert test_client.get("/api/v1/_test/limited").status_code == 200
    third = test_client.get("/api/v1/_test/limited")
    assert third.status_code == 429
    assert third.json()["error"]["code"] == "rate_limited"
    assert third.json()["error"]["details"]["retry_after"] > 0


def test_pagination_and_audit(test_client: TestClient, db: Session) -> None:
    for action in ["c", "a", "b"]:
        record_audit(db, actor_id=None, action=action, entity_type="thing", entity_id="1")
    db.commit()
    body = test_client.get("/api/v1/_test/audit?limit=2&offset=1").json()
    assert body == {"items": [{"action": "b"}, {"action": "c"}], "total": 3, "limit": 2, "offset": 1}
    assert test_client.get("/api/v1/_test/audit?limit=500").status_code == 422


def test_signed_media_urls(client: TestClient, container: Container) -> None:
    container.storage.put("covers/a.png", b"png-bytes", "image/png")
    url = container.storage.signed_url("covers/a.png")
    path = url.replace("http://testserver", "")
    ok = client.get(path)
    assert ok.status_code == 200
    assert ok.content == b"png-bytes"
    assert ok.headers["content-type"] == "image/png"

    tampered = client.get(path.replace("sig=", "sig=0"))
    assert tampered.status_code == 403
    assert tampered.json()["error"]["code"] == "invalid_signature"


def test_signed_url_expiry_and_key_validation(tmp_path: object) -> None:
    storage = InMemoryStorage(secret="s")
    assert not storage.verify("a.mp3", int(time.time()) - 1, "x")
    with pytest.raises(Exception):  # noqa: B017
        storage.put("../etc/passwd", b"")
    local = LocalStorage(str(tmp_path), secret="s", base_url="http://x")
    local.put("audio/ep1.wav", b"RIFF")
    assert local.get("audio/ep1.wav") == b"RIFF"
    assert local.exists("audio/ep1.wav")
    local.delete("audio/ep1.wav")
    assert not local.exists("audio/ep1.wav")


def test_in_memory_job_queue(container: Container) -> None:
    queue = container.queue
    assert isinstance(queue, InMemoryJobQueue)
    queue.enqueue("system.ping")
    assert [j.name for j in queue.jobs] == ["system.ping"]
    assert queue.run_pending() == 1
    assert queue.jobs == []
    with pytest.raises(KeyError):
        queue.enqueue("does.not.exist")


def test_events() -> None:
    seen: list[str] = []

    @subscribe("test_event")
    def handler(value: str) -> None:
        seen.append(value)

    emit("test_event", value="hello")
    emit("other_event", value="ignored")
    assert seen == ["hello"]
