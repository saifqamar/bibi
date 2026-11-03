"""Continuity check: seeded contradictions, validation, the audio gate and the drafting loop."""

from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai.adapters.fakes import FakeLLM
from app.modules.ai.models import AIUsage
from app.modules.identity import Role
from app.shared.jobs import InMemoryJobQueue
from tests.factories import TestUser

STUDIO = "/api/v1/studio"

EPISODE_TEXT = """The night was still.

Ben: I'm back, Ana. Did you miss me?
Ana: You drowned last winter.
Ana sailed away from the island at midnight.
The wedding was over long before the storm began.
Stranger: Who are you people?"""

SEEDED_ISSUES = [
    {  # a dead character speaks
        "severity": "error",
        "type": "character_fact",
        "description": "Ben died in episode 1 but speaks here.",
        "quote": "Ben: I'm back, Ana.",
        "source": {
            "kind": "bible",
            "entity_type": "characters",
            "entity_id": None,
            "episode_number": 1,
            "excerpt": "Ben drowned in the winter storm.",
        },
    },
    {  # a world rule is broken
        "severity": "error",
        "type": "world_rule",
        "description": "No one may leave the island at night.",
        "quote": "Ana sailed away from the island at midnight.",
        "source": {
            "kind": "bible",
            "entity_type": "world-rules",
            "entity_id": None,
            "episode_number": None,
            "excerpt": "No one leaves the island at night.",
        },
    },
    {  # timeline reversal
        "severity": "error",
        "type": "timeline",
        "description": "The storm happened before the wedding in episode 2.",
        "quote": "The wedding was over long before the storm began.",
        "source": {
            "kind": "episode",
            "entity_type": None,
            "entity_id": None,
            "episode_number": 2,
            "excerpt": "The storm hit on the eve of the wedding.",
        },
    },
    {  # invented quote: must be dropped
        "severity": "error",
        "type": "character_fact",
        "description": "Made up.",
        "quote": "Ana laughed at the ghost.",
        "source": {
            "kind": "bible",
            "entity_type": None,
            "entity_id": None,
            "episode_number": None,
            "excerpt": None,
        },
    },
]


@pytest.fixture
def writer(make: Callable[..., TestUser]) -> TestUser:
    return make(Role.WRITER)


@pytest.fixture
def llm(container: Container) -> FakeLLM:
    fake = FakeLLM({"continuity_check": {"issues": SEEDED_ISSUES}})
    container.llm = fake
    return fake


@pytest.fixture
def queue(container: Container) -> InMemoryJobQueue:
    assert isinstance(container.queue, InMemoryJobQueue)
    return container.queue


def make_episode(client: TestClient, writer: TestUser, text: str = EPISODE_TEXT) -> str:
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Island", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    for name in ["Ana", "Ben"]:
        client.post(
            f"{STUDIO}/series/{series['id']}/characters",
            json={"name": name},
            headers=writer.headers,
        )
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={"title": "Night"}, headers=writer.headers
    ).json()
    if text:
        client.post(
            f"{STUDIO}/episodes/{episode['id']}/drafts",
            json={"text": text, "base_version": None},
            headers=writer.headers,
        )
    return episode["id"]


def check(client: TestClient, writer: TestUser, queue: InMemoryJobQueue, episode_id: str) -> Any:
    response = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/continuity", headers=writer.headers
    )
    assert response.status_code == 202, response.text
    queue.run_pending()
    run = client.get(f"{STUDIO}/workflow-runs/{response.json()['id']}", headers=writer.headers)
    return run.json()


def issues(client: TestClient, writer: TestUser, episode_id: str, status: str = "") -> list:
    query = f"?status={status}" if status else ""
    return client.get(
        f"{STUDIO}/episodes/{episode_id}/continuity-issues{query}", headers=writer.headers
    ).json()


def test_seeded_contradictions_are_flagged(
    client: TestClient, writer: TestUser, llm: FakeLLM, queue: InMemoryJobQueue, db: Session
) -> None:
    episode_id = make_episode(client, writer)
    run = check(client, writer, queue, episode_id)
    assert run["status"] == "succeeded"
    found = issues(client, writer, episode_id)
    by_type = {(i["type"], i["severity"]) for i in found}
    assert by_type == {
        ("character_fact", "error"),
        ("world_rule", "error"),
        ("timeline", "error"),
        ("naming", "warning"),
    }
    assert all("Ana laughed" not in i["quote"] for i in found)  # invented quote dropped
    naming = next(i for i in found if i["type"] == "naming")
    assert naming["quote"] == "Stranger:"
    timeline = next(i for i in found if i["type"] == "timeline")
    assert timeline["source_ref"]["episode_number"] == 2
    assert {i["draft_version"] for i in found} == {1}

    # The model saw the bible and the text; its cost is recorded against the episode.
    prompt = llm.calls[-1]["messages"][0].content
    assert "Ben: I'm back" in prompt and '"name":"Ben"' in prompt
    usage = db.scalars(select(AIUsage).where(AIUsage.purpose == "continuity")).all()
    assert len(usage) == 1 and usage[0].cost_usd > 0


def test_open_errors_block_audio_but_warnings_do_not(
    client: TestClient, writer: TestUser, llm: FakeLLM, queue: InMemoryJobQueue
) -> None:
    episode_id = make_episode(client, writer)
    check(client, writer, queue, episode_id)
    status_path = f"{STUDIO}/episodes/{episode_id}/status"
    blocked = client.post(status_path, json={"status": "ready_for_audio"}, headers=writer.headers)
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "continuity_errors_open"
    assert blocked.json()["error"]["details"]["open_errors"] == 3

    errors = [i for i in issues(client, writer, episode_id) if i["severity"] == "error"]
    no_note = client.post(
        f"{STUDIO}/continuity-issues/{errors[0]['id']}/resolve",
        json={"status": "intentional"},
        headers=writer.headers,
    )
    assert no_note.json()["error"]["code"] == "note_required"
    client.post(
        f"{STUDIO}/continuity-issues/{errors[0]['id']}/resolve",
        json={"status": "intentional", "note": "Ben's ghost; it is the twist"},
        headers=writer.headers,
    )
    for issue in errors[1:]:
        client.post(
            f"{STUDIO}/continuity-issues/{issue['id']}/resolve",
            json={"status": "fixed"},
            headers=writer.headers,
        )
    again = client.post(
        f"{STUDIO}/continuity-issues/{errors[1]['id']}/resolve",
        json={"status": "fixed"},
        headers=writer.headers,
    )
    assert again.json()["error"]["code"] == "issue_resolved"

    # Only the naming warning is still open, and warnings do not block.
    assert [i["type"] for i in issues(client, writer, episode_id, "open")] == ["naming"]
    ready = client.post(status_path, json={"status": "ready_for_audio"}, headers=writer.headers)
    assert ready.json()["status"] == "ready_for_audio"


def test_recheck_respects_intentional_and_fixes_removed_quotes(
    client: TestClient, writer: TestUser, llm: FakeLLM, queue: InMemoryJobQueue
) -> None:
    episode_id = make_episode(client, writer)
    check(client, writer, queue, episode_id)
    ben = next(i for i in issues(client, writer, episode_id) if i["type"] == "character_fact")
    client.post(
        f"{STUDIO}/continuity-issues/{ben['id']}/resolve",
        json={"status": "intentional", "note": "ghost"},
        headers=writer.headers,
    )

    # Same text checked again: nothing is duplicated and the intentional one stays quiet.
    check(client, writer, queue, episode_id)
    assert len(issues(client, writer, episode_id)) == 4
    assert len(issues(client, writer, episode_id, "open")) == 3

    # The writer removes the world-rule sentence; the next check marks that issue fixed.
    new_text = EPISODE_TEXT.replace("Ana sailed away from the island at midnight.\n", "")
    client.post(
        f"{STUDIO}/episodes/{episode_id}/drafts",
        json={"text": new_text, "base_version": 1},
        headers=writer.headers,
    )
    check(client, writer, queue, episode_id)
    rule = next(i for i in issues(client, writer, episode_id) if i["type"] == "world_rule")
    assert rule["status"] == "fixed"
    assert "no longer in the episode" in rule["resolution_note"]


def test_drafting_waits_at_contradictions_until_resolved(
    client: TestClient, writer: TestUser, llm: FakeLLM, queue: InMemoryJobQueue
) -> None:
    llm.responders["draft"] = EPISODE_TEXT
    episode_id = make_episode(client, writer, text="")
    client.put(
        f"{STUDIO}/episodes/{episode_id}/plan",
        json={"beats": [{"id": "b1", "text": "Ben returns"}]},
        headers=writer.headers,
    )
    run_id = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/drafting", headers=writer.headers
    ).json()["id"]
    queue.run_pending()
    resume = lambda payload: client.post(  # noqa: E731
        f"{STUDIO}/workflow-runs/{run_id}/resume", json={"payload": payload}, headers=writer.headers
    )
    resume({"action": "approve"})
    queue.run_pending()
    run = client.get(f"{STUDIO}/workflow-runs/{run_id}", headers=writer.headers).json()
    assert run["status"] == "waiting"
    assert run["interrupt_payload"]["kind"] == "contradictions"

    # Saying "resolved" without resolving re-runs the check and waits again.
    resume({"action": "resolved"})
    queue.run_pending()
    run = client.get(f"{STUDIO}/workflow-runs/{run_id}", headers=writer.headers).json()
    assert run["interrupt_payload"]["kind"] == "contradictions"

    for issue in issues(client, writer, episode_id, "open"):
        if issue["severity"] == "error":
            client.post(
                f"{STUDIO}/continuity-issues/{issue['id']}/resolve",
                json={"status": "intentional", "note": "accepted"},
                headers=writer.headers,
            )
    resume({"action": "resolved"})
    queue.run_pending()
    run = client.get(f"{STUDIO}/workflow-runs/{run_id}", headers=writer.headers).json()
    assert run["status"] == "succeeded"  # no canon proposals from the fake, so it finishes
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "ready_for_audio"


def test_issue_to_canon_proposal_and_scoping(
    client: TestClient,
    writer: TestUser,
    llm: FakeLLM,
    queue: InMemoryJobQueue,
    make: Callable[..., TestUser],
) -> None:
    episode_id = make_episode(client, writer)
    check(client, writer, queue, episode_id)
    issue = issues(client, writer, episode_id)[0]
    response = client.post(
        f"{STUDIO}/continuity-issues/{issue['id']}/propose-canon",
        json={
            "entity_type": "world-rules",
            "op": "create",
            "payload": {"rule_text": "Night crossings are allowed with a lantern."},
        },
        headers=writer.headers,
    )
    assert response.status_code == 201
    series_id = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()[
        "series_id"
    ]
    proposals = client.get(
        f"{STUDIO}/series/{series_id}/canon-proposals", headers=writer.headers
    ).json()
    assert proposals[0]["reason"].startswith("From continuity issue:")

    other = make(Role.WRITER)
    assert (
        client.get(
            f"{STUDIO}/episodes/{episode_id}/continuity-issues", headers=other.headers
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"{STUDIO}/continuity-issues/{issue['id']}/resolve",
            json={"status": "fixed"},
            headers=other.headers,
        ).status_code
        == 404
    )
    empty = make_episode(client, writer, text="")
    no_text = client.post(f"{STUDIO}/episodes/{empty}/workflows/continuity", headers=writer.headers)
    assert no_text.json()["error"]["code"] == "episode_has_no_text"
