import uuid
from collections.abc import Callable
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai import LLMMessage, Metered, ProviderError, RunService, RunStatus, UsageContext
from app.modules.ai.adapters.fakes import FakeLLM
from app.modules.ai.metering import call_with_retry
from app.modules.ai.models import AIPrice, AIUsage
from app.modules.identity import Role
from app.shared.monitoring import init_sentry
from tests.conftest import make_settings
from tests.factories import TestUser

STUDIO = "/api/v1/studio"


def setup_episode(client: TestClient, writer: TestUser) -> tuple[uuid.UUID, uuid.UUID]:
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Costs", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={"title": "One"}, headers=writer.headers
    ).json()
    return uuid.UUID(series["id"]), uuid.UUID(episode["id"])


def metered(db: Session, container: Container, sid: uuid.UUID, eid: uuid.UUID, **kw) -> Metered:
    run = kw.pop("run_id", None)
    return Metered(
        db,
        container,
        UsageContext(
            purpose=kw.pop("purpose", "drafting"),
            workflow_run_id=run,
            episode_id=eid,
            series_id=sid,
        ),
    )


def test_metered_calls_record_usage_and_cost(
    client: TestClient, db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    sid, eid = setup_episode(client, writer)
    container.llm = FakeLLM({"draft": "x" * 400})
    m = metered(db, container, sid, eid)
    result = m.complete(system="s" * 40, messages=[LLMMessage("user", "u" * 360)], task="draft")
    assert (result.input_tokens, result.output_tokens) == (100, 100)
    metered(db, container, sid, eid, purpose="embedding").embed(["one two three four"])
    metered(db, container, sid, eid, purpose="tts").synthesize("Hello there, listener.", "v1")
    db.commit()

    rows = db.scalars(select(AIUsage).order_by(AIUsage.created_at)).all()
    assert [r.purpose for r in rows] == ["drafting", "embedding", "tts"]
    # fake-llm: $1 / $2 per million input / output tokens
    assert rows[0].cost_usd == Decimal("0.000300")
    assert rows[2].tts_characters == 22

    total = sum(r.cost_usd for r in rows)
    summary = client.get(f"{STUDIO}/episodes/{eid}/costs", headers=writer.headers).json()
    assert Decimal(summary["total_usd"]) == total
    assert {p["purpose"] for p in summary["by_purpose"]} == {"drafting", "embedding", "tts"}
    series = client.get(f"{STUDIO}/series/{sid}/costs", headers=writer.headers).json()
    assert Decimal(series["episodes"][0]["cost_usd"]) == total


def test_price_changes_do_not_rewrite_history(
    client: TestClient, db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    sid, eid = setup_episode(client, writer)
    container.llm = FakeLLM({"draft": "x" * 400})
    metered(db, container, sid, eid).complete(
        system="", messages=[LLMMessage("user", "y" * 400)], task="draft"
    )
    db.commit()
    before = db.scalar(select(AIUsage.cost_usd))
    for unit in ("input_token", "output_token"):
        db.add(
            AIPrice(
                provider="fake",
                model="fake-llm",
                unit=unit,
                usd_per_million=Decimal(100),
                effective_from=datetime.now(UTC),
            )
        )
    db.commit()
    metered(db, container, sid, eid).complete(
        system="", messages=[LLMMessage("user", "y" * 400)], task="draft"
    )
    db.commit()
    costs = list(db.scalars(select(AIUsage.cost_usd).order_by(AIUsage.created_at)))
    assert costs[0] == before
    assert costs[1] > before * 40


def test_retries_only_retryable_errors(container: Container) -> None:
    llm = FakeLLM()
    llm.fail_next = 2
    sleeps: list[float] = []
    result = call_with_retry(lambda: llm.complete(system="", messages=[]), sleep=sleeps.append)
    assert result.text and sleeps == [0.5, 1.0]

    llm.fail_with = ProviderError("bad", code="bad_request", retryable=False)
    calls = len(llm.calls)
    with pytest.raises(ProviderError):
        call_with_retry(lambda: llm.complete(system="", messages=[]), sleep=sleeps.append)
    assert len(llm.calls) == calls + 1

    llm.fail_with = None
    llm.fail_next = 5
    with pytest.raises(ProviderError) as exc:
        call_with_retry(lambda: llm.complete(system="", messages=[]), sleep=lambda _s: None)
    assert exc.value.code == "overloaded"


def test_run_events_stream_and_history(
    client: TestClient, db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    sid, eid = setup_episode(client, writer)
    runs = RunService(db)
    run = runs.create(
        workflow="drafting",
        thread_id=f"episode-{eid}:drafting",
        episode_id=eid,
        series_id=sid,
        requested_by=writer.id,
    )
    runs.set_status(run, RunStatus.RUNNING)
    runs.step(run, "load_context")
    runs.step(run, "draft")
    runs.set_status(run, RunStatus.FAILED, error="model overloaded")
    db.commit()

    with client.stream(
        "GET", f"{STUDIO}/workflow-runs/{run.id}/events", headers=writer.headers
    ) as response:
        assert response.headers["content-type"].startswith("text/event-stream")
        body = "".join(response.iter_text())
    events = [line.split(": ", 1)[1] for line in body.splitlines() if line.startswith("event: ")]
    assert events == ["progress"] * 5 + ["end"]
    assert '"step": "draft"' in body and "model overloaded" in body

    # Reconnecting after the third event only returns what came later.
    ids = [int(line[4:]) for line in body.splitlines() if line.startswith("id: ")]
    with client.stream(
        "GET",
        f"{STUDIO}/workflow-runs/{run.id}/events",
        headers={**writer.headers, "Last-Event-ID": str(ids[2])},
    ) as response:
        later = "".join(response.iter_text())
    assert later.count("event: progress") == 2

    history = client.get(f"{STUDIO}/episodes/{eid}/workflow-runs", headers=writer.headers).json()
    assert [(r["status"], r["error"]) for r in history] == [("failed", "model overloaded")]
    assert (
        client.get(f"{STUDIO}/workflow-runs/{run.id}", headers=writer.headers).json()[
            "current_step"
        ]
        == "draft"
    )


def test_only_one_active_run_per_episode(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    sid, eid = setup_episode(client, writer)
    runs = RunService(db)
    runs.create(
        workflow="drafting", thread_id="t", episode_id=eid, series_id=sid, requested_by=None
    )
    from app.shared.errors import Conflict

    with pytest.raises(Conflict) as exc:
        runs.create(
            workflow="drafting", thread_id="t", episode_id=eid, series_id=sid, requested_by=None
        )
    assert exc.value.code == "workflow_already_active"


def test_costs_and_runs_are_scoped(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    writer, other, admin = make(Role.WRITER), make(Role.WRITER), make(Role.ADMIN)
    sid, eid = setup_episode(client, writer)
    runs = RunService(db)
    run = runs.create(
        workflow="drafting", thread_id="t", episode_id=eid, series_id=sid, requested_by=writer.id
    )
    runs.set_status(run, RunStatus.CANCELLED)  # finished, so the event stream closes
    db.commit()
    for path in [
        f"/episodes/{eid}/costs",
        f"/series/{sid}/costs",
        f"/workflow-runs/{run.id}",
        f"/episodes/{eid}/workflow-runs",
        f"/workflow-runs/{run.id}/events",
    ]:
        assert client.get(STUDIO + path, headers=other.headers).status_code == 404, path
        assert client.get(STUDIO + path, headers=admin.headers).status_code == 200, path
    assert client.get("/api/v1/admin/costs", headers=writer.headers).status_code == 403


def test_admin_costs_and_budget(
    client: TestClient, db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer, admin = make(Role.WRITER), make(Role.ADMIN)
    sid, eid = setup_episode(client, writer)
    metered(db, container, sid, eid).complete(
        system="", messages=[LLMMessage("user", "z" * 4000)], task="draft"
    )
    metered(db, container, sid, eid, purpose="continuity").complete(
        system="", messages=[LLMMessage("user", "z" * 400)], task="check"
    )
    db.commit()

    by_series = client.get("/api/v1/admin/costs?group_by=series", headers=admin.headers).json()
    assert [r["label"] for r in by_series["rows"]] == ["Costs"]
    assert by_series["cost_per_finished_minute_usd"] is None
    by_purpose = client.get("/api/v1/admin/costs?group_by=purpose", headers=admin.headers).json()
    assert [r["key"] for r in by_purpose["rows"]] == ["drafting", "continuity"]
    by_episode = client.get("/api/v1/admin/costs?group_by=episode", headers=admin.headers).json()
    assert by_episode["rows"][0]["label"] == "Costs · 1. One"
    future = client.get("/api/v1/admin/costs?from=2099-01-01", headers=admin.headers).json()
    assert future["rows"] == [] and Decimal(future["total_usd"]) == 0

    budget = client.put(
        f"/api/v1/admin/series/{sid}/budget",
        json={"soft_limit_usd": "0.000001"},
        headers=admin.headers,
    ).json()
    assert budget["over_budget"] is True
    series = client.get(f"{STUDIO}/series/{sid}/costs", headers=writer.headers).json()
    assert series["budget"]["over_budget"] is True
    cleared = client.put(
        f"/api/v1/admin/series/{sid}/budget", json={"soft_limit_usd": None}, headers=admin.headers
    ).json()
    assert cleared == {"soft_limit_usd": None, "over_budget": False}


def test_sentry_only_initialises_with_a_dsn(monkeypatch: pytest.MonkeyPatch) -> None:
    import sentry_sdk

    calls: list[dict] = []  # type: ignore[type-arg]
    monkeypatch.setattr(sentry_sdk, "init", lambda **kw: calls.append(kw))
    assert init_sentry(make_settings(), component="api") is False
    assert (
        init_sentry(make_settings(sentry_dsn="https://k@o.ingest.sentry.io/1"), component="api")
        is True
    )
    assert calls[0]["send_default_pii"] is False
