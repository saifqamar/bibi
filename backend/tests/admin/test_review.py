"""Submit, review, publish and unpublish, plus what listeners see."""

import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai.adapters.fakes import FakeTTS
from app.modules.ai.models import ContinuityIssue, IssueSeverity
from app.modules.audio import processing
from app.modules.identity import CurrentUser, Role
from app.modules.writing import EpisodeService, EpisodeStatus
from app.modules.writing.models import Episode
from app.shared.audit import AuditLog
from app.shared.jobs import QUEUE_VOICE, InMemoryJobQueue
from tests.factories import TestUser

STUDIO = "/api/v1/studio"
ADMIN = "/api/v1/admin"
API = "/api/v1"
TEXT = "The fog came in.\nAna: Did you hear the bell?"

pytestmark = pytest.mark.skipif(not processing.ffmpeg_available(), reason="ffmpeg is required")


@pytest.fixture
def people(make: Callable[..., TestUser]) -> dict[str, TestUser]:
    return {"writer": make(Role.WRITER), "admin": make(Role.ADMIN), "listener": make(Role.LISTENER)}


@pytest.fixture
def produced(
    client: TestClient, people: dict[str, TestUser], container: Container
) -> dict[str, Any]:
    """An episode with approved-able audio: status audio_ready."""
    container.tts = FakeTTS()
    queue = container.queue
    assert isinstance(queue, InMemoryJobQueue)
    writer, admin = people["writer"], people["admin"]
    voice = client.post(
        f"{ADMIN}/voices",
        json={"provider": "fake", "provider_voice_id": "warm", "name": "Warm"},
        headers=admin.headers,
    ).json()
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Harbour", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    client.post(
        f"{STUDIO}/series/{series['id']}/characters", json={"name": "Ana"}, headers=writer.headers
    )
    client.put(
        f"{STUDIO}/series/{series['id']}/voice-assignments",
        json={"assignments": [{"character_id": None, "voice_id": voice["id"]}]},
        headers=writer.headers,
    )
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={"title": "Fog"}, headers=writer.headers
    ).json()
    client.post(
        f"{STUDIO}/episodes/{episode['id']}/drafts",
        json={"text": TEXT, "base_version": None},
        headers=writer.headers,
    )
    client.post(
        f"{STUDIO}/episodes/{episode['id']}/status",
        json={"status": "ready_for_audio"},
        headers=writer.headers,
    )
    client.post(f"{STUDIO}/episodes/{episode['id']}/audio", headers=writer.headers)
    queue.run_pending(QUEUE_VOICE)
    state = client.get(f"{STUDIO}/episodes/{episode['id']}", headers=writer.headers).json()
    assert state["status"] == "audio_ready"
    return {"series": series, "episode": episode, "queue": queue}


def submit(client: TestClient, writer: TestUser, episode_id: str) -> Any:
    return client.post(f"{STUDIO}/episodes/{episode_id}/submit", headers=writer.headers)


def queue_items(client: TestClient, admin: TestUser) -> list[dict]:
    return client.get(f"{ADMIN}/review-queue", headers=admin.headers).json()["items"]


def test_full_review_and_publish(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any], db: Session
) -> None:
    writer, admin, listener = people["writer"], people["admin"], people["listener"]
    episode_id, series_id = produced["episode"]["id"], produced["series"]["id"]

    submitted = submit(client, writer, episode_id)
    assert submitted.status_code == 201, submitted.text
    assert submitted.json()["status"] == "pending"
    assert (
        client.get(f"{STUDIO}/series/{series_id}", headers=writer.headers).json()["status"]
        == "in_review"
    )

    items = queue_items(client, admin)
    assert [(i["series_title"], i["episode_title"]) for i in items] == [("Harbour", "Fog")]
    detail = client.get(f"{ADMIN}/review-items/{items[0]['id']}", headers=admin.headers).json()
    assert detail["text"] == TEXT
    assert (detail["episode_status"], detail["is_live"]) == ("in_review", False)
    assert detail["audio"]["url"].startswith("http://testserver/media/")
    assert float(detail["cost"]["total_usd"]) > 0
    assert [v["version"] for v in detail["versions"]] == [1]

    # Listeners see nothing before publishing.
    assert client.get(f"{API}/series/{series_id}", headers=listener.headers).status_code == 404

    approved = client.post(
        f"{ADMIN}/review-items/{items[0]['id']}/approve", json={}, headers=admin.headers
    )
    assert approved.json()["status"] == "approved"
    assert queue_items(client, admin) == []
    assert (
        client.post(f"{ADMIN}/episodes/{episode_id}/publish", headers=admin.headers).status_code
        == 204
    )

    series = client.get(f"{API}/series/{series_id}", headers=listener.headers)
    assert series.status_code == 200 and series.json()["is_ai_assisted"] is True
    episodes = client.get(f"{API}/series/{series_id}/episodes", headers=listener.headers).json()
    assert [(e["number"], e["title"], e["is_free"]) for e in episodes] == [(1, "Fog", True)]
    assert float(episodes[0]["duration_seconds"]) > 1
    assert client.get(f"{API}/episodes/{episode_id}", headers=listener.headers).status_code == 200

    notes = client.get(f"{STUDIO}/notifications", headers=writer.headers).json()
    assert notes["unread"] == 2
    assert [n["kind"] for n in notes["items"]] == ["published", "approved"]
    client.post(f"{STUDIO}/notifications/{notes['items'][0]['id']}/read", headers=writer.headers)
    assert client.get(f"{STUDIO}/notifications", headers=writer.headers).json()["unread"] == 1

    actions = set(db.scalars(select(AuditLog.action)))
    assert {"review.submit", "review.approved", "episode.publish"} <= actions
    history = client.get(f"{STUDIO}/episodes/{episode_id}/reviews", headers=writer.headers).json()
    assert [h["status"] for h in history] == ["approved"]


def test_submit_pre_checks(
    client: TestClient,
    people: dict[str, TestUser],
    produced: dict[str, Any],
    db: Session,
    container: Container,
) -> None:
    writer = people["writer"]
    episode_id = produced["episode"]["id"]

    db.add(
        ContinuityIssue(
            episode_id=uuid.UUID(episode_id),
            draft_version=1,
            severity=IssueSeverity.ERROR,
            type="timeline",
            description="x",
            quote="fog",
        )
    )
    db.commit()
    assert submit(client, writer, episode_id).json()["error"]["code"] == "continuity_errors_open"
    db.query(ContinuityIssue).delete()
    db.commit()

    # A line fix changes the text without re-rendering: the audio is now stale.
    EpisodeService(db, container).replace_script_line(
        CurrentUser(id=writer.id, email="", role=Role.WRITER),
        uuid.UUID(episode_id),
        0,
        "The fog rolled in.",
    )
    db.commit()
    assert submit(client, writer, episode_id).json()["error"]["code"] == "audio_out_of_date"

    client.post(
        f"{STUDIO}/episodes/{episode_id}/drafts",
        json={"text": "New text", "base_version": 2},
        headers=writer.headers,
    )
    assert submit(client, writer, episode_id).json()["error"]["code"] == "audio_not_ready"


def test_writers_cannot_decide_or_publish(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any]
) -> None:
    writer, admin = people["writer"], people["admin"]
    episode_id = produced["episode"]["id"]
    submit(client, writer, episode_id)
    item_id = queue_items(client, admin)[0]["id"]
    for path in [
        f"/review-items/{item_id}/approve",
        f"/review-items/{item_id}/reject",
        f"/episodes/{episode_id}/publish",
        "/review-queue",
    ]:
        method = client.get if path == "/review-queue" else client.post
        kwargs: dict[str, Any] = {} if path == "/review-queue" else {"json": {"comments": "x"}}
        assert method(f"{ADMIN}{path}", headers=writer.headers, **kwargs).status_code == 403


def test_request_changes_needs_comments_and_notifies(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any]
) -> None:
    writer, admin = people["writer"], people["admin"]
    episode_id = produced["episode"]["id"]
    submit(client, writer, episode_id)
    item_id = queue_items(client, admin)[0]["id"]
    empty = client.post(
        f"{ADMIN}/review-items/{item_id}/request-changes",
        json={"comments": "  "},
        headers=admin.headers,
    )
    assert empty.status_code == 422 and empty.json()["error"]["code"] == "comments_required"
    done = client.post(
        f"{ADMIN}/review-items/{item_id}/request-changes",
        json={"comments": "Slow down the ending."},
        headers=admin.headers,
    )
    assert done.json()["status"] == "changes_requested"
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "changes_requested"
    notes = client.get(f"{STUDIO}/notifications", headers=writer.headers).json()["items"]
    assert notes[0]["message"] == "Changes requested: Slow down the ending."
    again = client.post(f"{ADMIN}/review-items/{item_id}/approve", json={}, headers=admin.headers)
    assert again.json()["error"]["code"] == "review_decided"


def test_reject_returns_episode_and_series_to_draft(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any]
) -> None:
    writer, admin = people["writer"], people["admin"]
    episode_id, series_id = produced["episode"]["id"], produced["series"]["id"]
    submit(client, writer, episode_id)
    item_id = queue_items(client, admin)[0]["id"]
    rejected = client.post(
        f"{ADMIN}/review-items/{item_id}/reject",
        json={"comments": "Off-brand."},
        headers=admin.headers,
    )
    assert rejected.json()["status"] == "rejected"
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "ready_for_audio"
    series = client.get(f"{STUDIO}/series/{series_id}", headers=writer.headers).json()
    assert series["status"] == "draft"


def test_no_publish_without_approval_of_current_text(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any], db: Session
) -> None:
    admin = people["admin"]
    episode_id = produced["episode"]["id"]
    episode = db.get(Episode, uuid.UUID(episode_id))
    assert episode
    episode.status = EpisodeStatus.APPROVED  # status alone, no review
    db.commit()
    response = client.post(f"{ADMIN}/episodes/{episode_id}/publish", headers=admin.headers)
    assert response.json()["error"]["code"] == "approval_missing"


def test_unpublish_and_editing_after_publish(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any]
) -> None:
    writer, admin, listener = people["writer"], people["admin"], people["listener"]
    episode_id, series_id = produced["episode"]["id"], produced["series"]["id"]
    submit(client, writer, episode_id)
    item_id = queue_items(client, admin)[0]["id"]
    client.post(
        f"{ADMIN}/review-items/{item_id}/approve", json={"publish_now": True}, headers=admin.headers
    )
    assert (
        len(client.get(f"{API}/series/{series_id}/episodes", headers=listener.headers).json()) == 1
    )

    # The writer edits the published episode: it goes back to drafting but stays live.
    client.post(
        f"{STUDIO}/episodes/{episode_id}/drafts",
        json={"text": TEXT + "\nMore.", "base_version": 1},
        headers=writer.headers,
    )
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "drafting"
    assert client.get(f"{API}/episodes/{episode_id}", headers=listener.headers).status_code == 200

    assert (
        client.post(f"{ADMIN}/episodes/{episode_id}/unpublish", headers=admin.headers).status_code
        == 204
    )
    assert client.get(f"{API}/episodes/{episode_id}", headers=listener.headers).status_code == 404
    assert client.get(f"{API}/series/{series_id}", headers=listener.headers).status_code == 404
    again = client.post(f"{ADMIN}/episodes/{episode_id}/unpublish", headers=admin.headers)
    assert again.json()["error"]["code"] == "not_published"


def test_free_episode_override(
    client: TestClient, people: dict[str, TestUser], produced: dict[str, Any], db: Session
) -> None:
    writer, admin, listener = people["writer"], people["admin"], people["listener"]
    episode_id, series_id = produced["episode"]["id"], produced["series"]["id"]
    submit(client, writer, episode_id)
    item_id = queue_items(client, admin)[0]["id"]
    client.post(
        f"{ADMIN}/review-items/{item_id}/approve", json={"publish_now": True}, headers=admin.headers
    )
    episode = db.get(Episode, uuid.UUID(episode_id))
    assert episode
    episode.is_free = False
    db.commit()
    listed = client.get(f"{API}/series/{series_id}/episodes", headers=listener.headers).json()
    assert listed[0]["is_free"] is False
