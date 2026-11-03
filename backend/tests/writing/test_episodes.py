import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.identity import Role
from app.modules.writing import EpisodeService, EpisodeStatus
from app.modules.writing.models import Episode
from app.shared.audit import AuditLog
from tests.factories import TestUser

API = "/api/v1/studio"


@pytest.fixture
def writer(make: Callable[..., TestUser]) -> TestUser:
    return make(Role.WRITER)


@pytest.fixture
def series_id(client: TestClient, writer: TestUser) -> str:
    response = client.post(
        f"{API}/series",
        json={"title": "Harbour", "language": "en", "themes": [], "target_episode_minutes": 15},
        headers=writer.headers,
    )
    return response.json()["id"]


def new_episode(client: TestClient, writer: TestUser, series_id: str, title: str) -> dict[str, Any]:
    response = client.post(
        f"{API}/series/{series_id}/episodes", json={"title": title}, headers=writer.headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def save(
    client: TestClient,
    writer: TestUser,
    episode_id: str,
    text: str,
    base: int | None,
    note: str = "",
) -> Any:
    return client.post(
        f"{API}/episodes/{episode_id}/drafts",
        json={"text": text, "base_version": base, "note": note},
        headers=writer.headers,
    )


def test_create_number_and_plan(client: TestClient, writer: TestUser, series_id: str) -> None:
    first = new_episode(client, writer, series_id, "Arrival")
    second = new_episode(client, writer, series_id, "The bell")
    assert (first["number"], second["number"]) == (1, 2)
    assert first["status"] == "planned" and first["target_seconds"] == 900

    plan = client.put(
        f"{API}/episodes/{first['id']}/plan",
        json={
            "beats": [{"id": "b1", "text": "Ana arrives"}, {"id": "b2", "text": "Storm"}],
            "notes": "Keep it slow",
        },
        headers=writer.headers,
    ).json()
    assert [b["text"] for b in plan["plan"]["beats"]] == ["Ana arrives", "Storm"]
    duplicate = client.put(
        f"{API}/episodes/{first['id']}/plan",
        json={"beats": [{"id": "b1", "text": "x"}, {"id": "b1", "text": "y"}]},
        headers=writer.headers,
    )
    assert duplicate.json()["error"]["code"] == "duplicate_beat"

    listed = client.get(f"{API}/series/{series_id}/episodes", headers=writer.headers).json()
    assert [e["title"] for e in listed] == ["Arrival", "The bell"]


def test_reorder_and_delete(client: TestClient, writer: TestUser, series_id: str) -> None:
    ids = [new_episode(client, writer, series_id, t)["id"] for t in ["A", "B", "C"]]
    response = client.put(
        f"{API}/series/{series_id}/episodes/order",
        json={"episode_ids": [ids[2], ids[0], ids[1]]},
        headers=writer.headers,
    )
    assert response.status_code == 204
    titles = lambda: [  # noqa: E731
        e["title"]
        for e in client.get(f"{API}/series/{series_id}/episodes", headers=writer.headers).json()
    ]
    assert titles() == ["C", "A", "B"]
    assert client.delete(f"{API}/episodes/{ids[2]}", headers=writer.headers).status_code == 204
    numbers = [
        (e["title"], e["number"])
        for e in client.get(f"{API}/series/{series_id}/episodes", headers=writer.headers).json()
    ]
    assert numbers == [("A", 1), ("B", 2)]


def test_versions_and_optimistic_concurrency(
    client: TestClient, writer: TestUser, series_id: str, db: Session
) -> None:
    episode = new_episode(client, writer, series_id, "Arrival")
    eid = episode["id"]
    first = save(client, writer, eid, "Ana: Hello.", None, "first pass")
    assert first.status_code == 201
    assert first.json()["version"] == 1 and first.json()["source"] == "human"

    same = save(client, writer, eid, "Ana: Hello.", 1)
    assert same.status_code == 200 and same.json()["version"] == 1  # no new version

    stale = save(client, writer, eid, "Someone else's text", None)
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "version_conflict"
    assert stale.json()["error"]["details"]["current_version"] == 1

    assert save(client, writer, eid, "Ana: Hello.\nBen: Hi.", 1).json()["version"] == 2
    restored = client.post(f"{API}/episodes/{eid}/drafts/1/restore", headers=writer.headers).json()
    assert restored["version"] == 3 and restored["note"] == "Restored from v1"
    assert restored["text"] == "Ana: Hello."

    history = client.get(f"{API}/episodes/{eid}/drafts", headers=writer.headers).json()
    assert [h["version"] for h in history] == [3, 2, 1]
    assert {h["source"] for h in history} == {"human"}
    assert client.get(f"{API}/episodes/{eid}/drafts/2", headers=writer.headers).json()["text"] == (
        "Ana: Hello.\nBen: Hi."
    )

    detail = client.get(f"{API}/episodes/{eid}", headers=writer.headers).json()
    assert detail["status"] == "drafting" and detail["current_version"] == 3

    actions = list(db.scalars(select(AuditLog.action).where(AuditLog.entity_type == "episode")))
    assert actions.count("episode.draft_save") == 2 and "episode.draft_restore" in actions


def test_compare(client: TestClient, writer: TestUser, series_id: str) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    save(client, writer, eid, "one\ntwo\nthree", None)
    save(client, writer, eid, "one\n2\nthree\nfour", 1)
    ops = client.get(f"{API}/episodes/{eid}/drafts/compare?a=1&b=2", headers=writer.headers).json()
    assert [(o["op"], o["a_lines"], o["b_lines"]) for o in ops["ops"]] == [
        ("equal", ["one"], ["one"]),
        ("replace", ["two"], ["2"]),
        ("equal", ["three"], ["three"]),
        ("insert", [], ["four"]),
    ]
    missing = client.get(f"{API}/episodes/{eid}/drafts/compare?a=1&b=9", headers=writer.headers)
    assert missing.status_code == 404


def test_duration_and_script(client: TestClient, writer: TestUser, series_id: str) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    client.post(
        f"{API}/series/{series_id}/characters", json={"name": "Ana"}, headers=writer.headers
    )
    text = "Ana: " + " ".join(["word"] * 299) + "\nStranger: hello"
    save(client, writer, eid, text, None)
    detail = client.get(f"{API}/episodes/{eid}", headers=writer.headers).json()
    assert detail["word_count"] == 302
    assert detail["estimated_seconds"] == 121
    script = client.get(f"{API}/episodes/{eid}/script", headers=writer.headers).json()
    assert script[0]["speaker"] == "Ana"
    assert script[1]["unknown_speaker"] == "Stranger"


def test_writer_status_changes(client: TestClient, writer: TestUser, series_id: str) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    no_text = client.post(
        f"{API}/episodes/{eid}/status", json={"status": "drafting"}, headers=writer.headers
    )
    assert no_text.json()["status"] == "drafting"
    blocked = client.post(
        f"{API}/episodes/{eid}/status", json={"status": "ready_for_audio"}, headers=writer.headers
    )
    assert blocked.json()["error"]["code"] == "episode_has_no_text"
    save(client, writer, eid, "Some text", None)
    ready = client.post(
        f"{API}/episodes/{eid}/status", json={"status": "ready_for_audio"}, headers=writer.headers
    )
    assert ready.json()["status"] == "ready_for_audio"
    forbidden = client.post(
        f"{API}/episodes/{eid}/status", json={"status": "published"}, headers=writer.headers
    )
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "status_change_not_allowed"


def test_editing_approved_episode_returns_to_drafting(
    client: TestClient, writer: TestUser, series_id: str, db: Session, container: Container
) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    save(client, writer, eid, "v1", None)
    episode = db.get(Episode, uuid.UUID(eid))
    assert episode
    episode.status = EpisodeStatus.APPROVED
    db.commit()
    assert save(client, writer, eid, "v2", 1).status_code == 201
    assert (
        client.get(f"{API}/episodes/{eid}", headers=writer.headers).json()["status"] == "drafting"
    )

    episode.status = EpisodeStatus.IN_REVIEW
    db.commit()
    locked = save(client, writer, eid, "v3", 2)
    assert locked.json()["error"]["code"] == "episode_in_review"
    not_deletable = client.delete(f"{API}/episodes/{eid}", headers=writer.headers)
    assert not_deletable.json()["error"]["code"] == "episode_not_deletable"


def test_ai_drafts_record_source(
    client: TestClient, writer: TestUser, series_id: str, db: Session, container: Container
) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    EpisodeService(db, container).save_ai_draft(uuid.UUID(eid), "AI text", "drafted from beats")
    db.commit()
    history = client.get(f"{API}/episodes/{eid}/drafts", headers=writer.headers).json()
    assert history[0]["source"] == "ai" and history[0]["created_by"] is None


def test_other_writers_cannot_see_episodes(
    client: TestClient, writer: TestUser, series_id: str, make: Callable[..., TestUser]
) -> None:
    eid = new_episode(client, writer, series_id, "E")["id"]
    other = make(Role.WRITER)
    assert client.get(f"{API}/episodes/{eid}", headers=other.headers).status_code == 404
    assert (
        client.get(f"{API}/series/{series_id}/episodes", headers=other.headers).status_code == 404
    )
    assert save(client, other, eid, "x", None).status_code == 404
