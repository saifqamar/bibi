import uuid
from collections.abc import Callable
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai.adapters.fakes import FakeLLM
from app.modules.ai.adapters.ports import ProviderError
from app.modules.ai.checkpointer import get_checkpointer
from app.modules.ai.models import AIUsage
from app.modules.identity import Role
from app.modules.writing.models import Character, EpisodeSummary
from app.shared.jobs import InMemoryJobQueue
from tests.factories import TestUser

STUDIO = "/api/v1/studio"
SCRIPT = "The fog came in at dusk.\n\nAna: Did you hear the bell?\n[[scene]]\nMorning came."


def fake_llm() -> FakeLLM:
    return FakeLLM(
        {
            "draft": SCRIPT,
            "regenerate_section": "REWRITTEN",
            "propose_canon": {
                "proposals": [
                    {
                        "entity_type": "characters",
                        "op": "create",
                        "entity_id": None,
                        "payload": {"name": "Cora", "description": "the keeper"},
                        "reason": "Introduced in this episode",
                    },
                    {  # malformed: dropped without failing the run
                        "entity_type": "characters",
                        "op": "update",
                        "entity_id": None,
                        "payload": {},
                        "reason": "no id",
                    },
                ]
            },
            "summarize": "Ana hears a bell in the fog.",
        }
    )


@pytest.fixture
def writer(make: Callable[..., TestUser]) -> TestUser:
    return make(Role.WRITER)


@pytest.fixture
def queue(container: Container) -> InMemoryJobQueue:
    container.llm = fake_llm()
    assert isinstance(container.queue, InMemoryJobQueue)
    return container.queue


def make_episode(client: TestClient, writer: TestUser, beats: bool = True) -> tuple[str, str]:
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Bells", "language": "en", "themes": ["mystery"]},
        headers=writer.headers,
    ).json()
    client.post(
        f"{STUDIO}/series/{series['id']}/characters", json={"name": "Ana"}, headers=writer.headers
    )
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={"title": "Fog"}, headers=writer.headers
    ).json()
    if beats:
        client.put(
            f"{STUDIO}/episodes/{episode['id']}/plan",
            json={"beats": [{"id": "b1", "text": "Ana hears a bell in the fog"}]},
            headers=writer.headers,
        )
    return series["id"], episode["id"]


def run_state(client: TestClient, writer: TestUser, run_id: str) -> dict[str, Any]:
    return client.get(f"{STUDIO}/workflow-runs/{run_id}", headers=writer.headers).json()


def resume(client: TestClient, writer: TestUser, run_id: str, payload: Any) -> Any:
    return client.post(
        f"{STUDIO}/workflow-runs/{run_id}/resume", json={"payload": payload}, headers=writer.headers
    )


def new_process() -> None:
    """Forget the cached checkpointer, as if a different worker picked the run up later."""
    get_checkpointer.cache_clear()


def test_full_drafting_run_with_interrupts(
    client: TestClient, writer: TestUser, queue: InMemoryJobQueue, db: Session
) -> None:
    _, episode_id = make_episode(client, writer)
    started = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/drafting", headers=writer.headers
    )
    assert started.status_code == 202
    run_id = started.json()["id"]
    assert started.json()["status"] == "queued"
    assert [j.name for j in queue.jobs] == ["ai.run_workflow"]

    # 1. Draft, then wait for the writer's review.
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["status"] == "waiting"
    assert state["interrupt_payload"] == {"kind": "draft_review", "draft_version": 1}
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "drafting" and episode["current_version"] == 1
    drafts = client.get(f"{STUDIO}/episodes/{episode_id}/drafts", headers=writer.headers).json()
    assert drafts[0]["source"] == "ai"

    # 2. Days later, in another process: regenerate the first sentence.
    new_process()
    assert (
        resume(
            client,
            writer,
            run_id,
            {
                "action": "regenerate",
                "sections": [{"start": 0, "end": 24, "note": "make it colder"}],
            },
        ).status_code
        == 202
    )
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["interrupt_payload"]["kind"] == "draft_review"
    text = client.get(f"{STUDIO}/episodes/{episode_id}/drafts/2", headers=writer.headers).json()
    assert text["text"].startswith("REWRITTEN") and text["source"] == "ai"

    # 3. Approve: continuity passes, canon proposals are created, nothing in canon changes yet.
    new_process()
    resume(client, writer, run_id, {"action": "approve"})
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["interrupt_payload"]["kind"] == "canon_confirmation"
    assert len(state["interrupt_payload"]["proposal_ids"]) == 1
    assert db.scalar(select(func.count()).select_from(Character)) == 1

    # 4. The writer accepts the proposal, then finishes the run.
    proposal_id = state["interrupt_payload"]["proposal_ids"][0]
    client.post(f"{STUDIO}/canon-proposals/{proposal_id}/accept", headers=writer.headers)
    resume(client, writer, run_id, {"action": "done"})
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["status"] == "succeeded"
    episode = client.get(f"{STUDIO}/episodes/{episode_id}", headers=writer.headers).json()
    assert episode["status"] == "ready_for_audio"
    assert db.scalar(select(func.count()).select_from(Character)) == 2

    summary = db.scalar(
        select(EpisodeSummary).where(EpisodeSummary.episode_id == uuid.UUID(episode_id))
    )
    assert summary is not None and summary.summary == "Ana hears a bell in the fog."
    assert len(summary.embedding) == 1536 and summary.draft_version == 2

    # Every AI call was metered against this run and the totals agree.
    usage = db.scalars(select(AIUsage).where(AIUsage.workflow_run_id == uuid.UUID(run_id))).all()
    assert {u.purpose for u in usage} >= {
        "drafting",
        "regeneration",
        "canon",
        "summary",
        "embedding",
    }
    costs = client.get(f"{STUDIO}/episodes/{episode_id}/costs", headers=writer.headers).json()
    assert Decimal(costs["total_usd"]) == sum(u.cost_usd for u in usage)
    assert Decimal(state["cost_usd"]) == Decimal(costs["total_usd"])

    # Progress events were recorded for the live stream.
    with client.stream(
        "GET", f"{STUDIO}/workflow-runs/{run_id}/events", headers=writer.headers
    ) as response:
        body = "".join(response.iter_text())
    for step in ["load_context", "draft", "writer_review", "propose_canon", "finalize"]:
        assert f'"step": "{step}"' in body


def test_edit_decision_saves_writer_version(
    client: TestClient, writer: TestUser, queue: InMemoryJobQueue
) -> None:
    _, episode_id = make_episode(client, writer)
    run_id = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/drafting", headers=writer.headers
    ).json()["id"]
    queue.run_pending()
    resume(client, writer, run_id, {"action": "edit", "text": "Ana: My own words."})
    queue.run_pending()
    drafts = client.get(f"{STUDIO}/episodes/{episode_id}/drafts", headers=writer.headers).json()
    assert (drafts[0]["version"], drafts[0]["source"]) == (2, "human")
    assert drafts[0]["created_by"] == str(writer.id)


def test_guards(
    client: TestClient, writer: TestUser, queue: InMemoryJobQueue, make: Callable[..., TestUser]
) -> None:
    _, no_beats = make_episode(client, writer, beats=False)
    response = client.post(
        f"{STUDIO}/episodes/{no_beats}/workflows/drafting", headers=writer.headers
    )
    assert response.json()["error"]["code"] == "plan_has_no_beats"

    _, episode_id = make_episode(client, writer)
    path = f"{STUDIO}/episodes/{episode_id}/workflows/drafting"
    run_id = client.post(path, headers=writer.headers).json()["id"]
    assert client.post(path, headers=writer.headers).json()["error"]["code"] == (
        "workflow_already_active"
    )
    other = make(Role.WRITER)
    assert client.post(path, headers=other.headers).status_code == 404

    not_waiting = resume(client, writer, run_id, {"action": "approve"})
    assert not_waiting.json()["error"]["code"] == "workflow_not_waiting"
    queue.run_pending()
    wrong = resume(client, writer, run_id, {"action": "done"})
    assert wrong.status_code == 422 and wrong.json()["error"]["code"] == "invalid_resume"
    outside = resume(
        client, writer, run_id, {"action": "regenerate", "sections": [{"start": 0, "end": 99999}]}
    )
    assert outside.json()["error"]["code"] == "bad_section"


def test_failure_then_retry_from_checkpoint(
    client: TestClient, writer: TestUser, queue: InMemoryJobQueue, container: Container
) -> None:
    _, episode_id = make_episode(client, writer)
    assert isinstance(container.llm, FakeLLM)
    container.llm.fail_with = ProviderError("invalid request", code="bad_request")
    run_id = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/drafting", headers=writer.headers
    ).json()["id"]
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["status"] == "failed"
    assert "bad_request" in state["error"] and state["current_step"] == "draft"

    container.llm.fail_with = None
    assert resume(client, writer, run_id, None).status_code == 202
    queue.run_pending()
    state = run_state(client, writer, run_id)
    assert state["status"] == "waiting" and state["interrupt_payload"]["kind"] == "draft_review"
    # load_context was not repeated: it ran once, before the failure.
    with client.stream(
        "GET", f"{STUDIO}/workflow-runs/{run_id}/events", headers=writer.headers
    ) as response:
        body = "".join(response.iter_text())
    assert body.count('"step": "load_context"') == 1


def test_cancel(client: TestClient, writer: TestUser, queue: InMemoryJobQueue) -> None:
    _, episode_id = make_episode(client, writer)
    run_id = client.post(
        f"{STUDIO}/episodes/{episode_id}/workflows/drafting", headers=writer.headers
    ).json()["id"]
    cancelled = client.post(f"{STUDIO}/workflow-runs/{run_id}/cancel", headers=writer.headers)
    assert cancelled.json()["status"] == "cancelled"
    queue.run_pending()  # the queued job notices and does nothing
    assert run_state(client, writer, run_id)["status"] == "cancelled"
    drafts = client.get(f"{STUDIO}/episodes/{episode_id}/drafts", headers=writer.headers).json()
    assert drafts == []
    again = client.post(f"{STUDIO}/workflow-runs/{run_id}/cancel", headers=writer.headers)
    assert again.json()["error"]["code"] == "workflow_finished"


def test_regenerate_section_outside_a_run(
    client: TestClient, writer: TestUser, queue: InMemoryJobQueue
) -> None:
    _, episode_id = make_episode(client, writer)
    client.post(
        f"{STUDIO}/episodes/{episode_id}/drafts",
        json={"text": "Keep this. Change this. Keep that.", "base_version": None},
        headers=writer.headers,
    )
    response = client.post(
        f"{STUDIO}/episodes/{episode_id}/regenerate-section",
        json={"sections": [{"start": 11, "end": 23, "note": "warmer"}]},
        headers=writer.headers,
    )
    assert response.status_code == 202 and response.json()["workflow"] == "section_regen"
    queue.run_pending()
    assert run_state(client, writer, response.json()["id"])["status"] == "succeeded"
    latest = client.get(f"{STUDIO}/episodes/{episode_id}/drafts/2", headers=writer.headers).json()
    assert latest["text"] == "Keep this. REWRITTEN Keep that."
    assert latest["source"] == "ai"
