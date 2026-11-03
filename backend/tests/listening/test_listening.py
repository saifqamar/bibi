"""Listening events, progress, downloads and the analytics built from them."""

import uuid
from collections.abc import Callable
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai.models import AIUsage
from app.modules.analytics import AnalyticsService
from app.modules.audio.models import AudioAsset
from app.modules.catalog.models import Series, SeriesStatus
from app.modules.identity import Role
from app.modules.listening.models import Download, ListeningEvent, PlaybackProgress
from app.modules.writing.models import Episode
from app.shared.jobs import InMemoryJobQueue
from tests.factories import TestUser

API = "/api/v1"
STUDIO = "/api/v1/studio"
DAY0 = datetime(2026, 10, 1, 20, 0, tzinfo=UTC)


@pytest.fixture
def published(client: TestClient, make: Callable[..., TestUser], db: Session) -> dict[str, Any]:
    """A published series with two live 10-minute episodes and one unpublished episode."""
    writer = make(Role.WRITER)
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Harbour", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    ids = [
        client.post(
            f"{STUDIO}/series/{series['id']}/episodes", json={"title": t}, headers=writer.headers
        ).json()["id"]
        for t in ("One", "Two", "Three")
    ]
    for episode_id in ids[:2]:
        asset = AudioAsset(
            episode_id=uuid.UUID(episode_id),
            storage_key=f"a/{episode_id}.mp3",
            format="mp3",
            duration_seconds=Decimal(600),
        )
        db.add(asset)
        db.flush()
        episode = db.get(Episode, uuid.UUID(episode_id))
        assert episode
        episode.published_audio_id = asset.id
        episode.published_duration_seconds = Decimal(600)
        episode.published_at = DAY0
    row = db.get(Series, uuid.UUID(series["id"]))
    assert row
    row.status = SeriesStatus.PUBLISHED
    db.commit()
    return {"series": series["id"], "episodes": ids}


def event(
    episode_id: str, type_: str, position: float = 0, at: datetime = DAY0, **extra: Any
) -> dict[str, Any]:
    return {
        "client_event_id": uuid.uuid4().hex,
        "type": type_,
        "episode_id": episode_id,
        "position_seconds": position,
        "client_ts": at.isoformat(),
        "session_id": "s1",
        **extra,
    }


def send(client: TestClient, user: TestUser, events: list[dict[str, Any]]) -> Any:
    return client.post(f"{API}/events", json={"events": events}, headers=user.headers)


def test_batches_are_idempotent_and_validated(
    client: TestClient, make: Callable[..., TestUser], published: dict[str, Any]
) -> None:
    listener = make(Role.LISTENER)
    one, _, unpublished = published["episodes"]
    batch = [event(one, "play_started"), event(one, "play_paused", 30)]
    assert send(client, listener, batch).json() == {"accepted": 2, "duplicates": 0, "rejected": []}
    assert send(client, listener, batch).json() == {"accepted": 0, "duplicates": 2, "rejected": []}

    mixed = send(
        client,
        listener,
        [event(one, "dance"), event(unpublished, "play_started"), event(one, "play_resumed", 30)],
    ).json()
    assert mixed["accepted"] == 1
    assert mixed["rejected"] == [
        {"index": 0, "code": "unknown_event_type"},
        {"index": 1, "code": "episode_not_published"},
    ]

    too_many = send(client, listener, [event(one, "play_paused") for _ in range(201)])
    assert too_many.status_code == 422
    huge = client.post(
        f"{API}/events",
        content=b"x" * (257 * 1024),
        headers={**listener.headers, "Content-Type": "application/json"},
    )
    assert huge.status_code == 413
    assert client.post(f"{API}/events", json={"events": batch}).status_code == 401


def test_offline_events_keep_their_client_time(
    client: TestClient, make: Callable[..., TestUser], published: dict[str, Any], db: Session
) -> None:
    listener = make(Role.LISTENER)
    yesterday = datetime.now(UTC) - timedelta(days=1)
    send(client, listener, [event(published["episodes"][0], "play_started", at=yesterday)])
    stored = db.scalar(select(ListeningEvent))
    assert stored is not None and abs((stored.client_ts - yesterday).total_seconds()) < 1
    assert stored.received_at > stored.client_ts


def test_progress_latest_client_time_wins_and_completion(
    client: TestClient, make: Callable[..., TestUser], published: dict[str, Any]
) -> None:
    listener = make(Role.LISTENER)
    one, two, unpublished = published["episodes"]
    put = lambda eid, pos, at, **kw: client.put(  # noqa: E731
        f"{API}/me/progress/{eid}",
        json={"position_seconds": pos, "client_ts": at.isoformat(), **kw},
        headers=listener.headers,
    )
    assert put(one, 120, DAY0).json()["completed"] is False
    assert put(one, 60, DAY0 - timedelta(minutes=5)).json()["position_seconds"] == "120.000"
    assert put(one, 575, DAY0 + timedelta(minutes=10)).json()["completed"] is True  # >= 95%
    put(two, 10, DAY0 + timedelta(minutes=20))
    assert put(unpublished, 1, DAY0).status_code == 404

    progress = client.get(f"{API}/me/progress", headers=listener.headers).json()
    assert [(p["episode_title"], p["series_title"]) for p in progress] == [
        ("Two", "Harbour"),
        ("One", "Harbour"),
    ]
    send(client, listener, [event(two, "play_completed", 600, at=DAY0 + timedelta(hours=1))])
    two_progress = next(
        p
        for p in client.get(f"{API}/me/progress", headers=listener.headers).json()
        if p["episode_title"] == "Two"
    )
    assert two_progress["completed"] is True


def test_downloads_and_unpublished_cleanup(
    client: TestClient, make: Callable[..., TestUser], published: dict[str, Any], db: Session
) -> None:
    listener = make(Role.LISTENER)
    one, two, _ = published["episodes"]
    for episode_id in (one, two):
        assert (
            client.post(
                f"{API}/me/downloads", json={"episode_id": episode_id}, headers=listener.headers
            ).status_code
            == 201
        )
    episode = db.get(Episode, uuid.UUID(two))
    assert episode
    episode.published_audio_id = None  # unpublished after the download
    db.commit()
    listed = {
        d["episode_id"]: d["available"]
        for d in client.get(f"{API}/me/downloads", headers=listener.headers).json()
    }
    assert listed == {one: True, two: False}
    client.delete(f"{API}/me/downloads/{two}", headers=listener.headers)
    assert [
        d["episode_id"] for d in client.get(f"{API}/me/downloads", headers=listener.headers).json()
    ] == [one]


def test_account_deletion_anonymises_events(
    client: TestClient, make: Callable[..., TestUser], published: dict[str, Any], db: Session
) -> None:
    listener = make(Role.LISTENER)
    one = published["episodes"][0]
    send(client, listener, [event(one, "play_started")])
    client.put(
        f"{API}/me/progress/{one}",
        json={"position_seconds": 5, "client_ts": DAY0.isoformat()},
        headers=listener.headers,
    )
    client.post(f"{API}/me/downloads", json={"episode_id": one}, headers=listener.headers)
    assert client.delete(f"{API}/me", headers=listener.headers).status_code == 204
    db.expire_all()
    stored = db.scalar(select(ListeningEvent))
    assert stored is not None and stored.user_id is None
    assert db.scalar(select(PlaybackProgress)) is None and db.scalar(select(Download)) is None


def seed(client: TestClient, make: Callable[..., TestUser], one: str, two: str) -> None:
    """Three listeners:
    A: plays 1, finishes it, starts 2, drops off in 2 at 2.5 min; comes back the next day.
    B: plays 1, drops off at 4 min; comes back 7 days later.
    C: plays 1 and finishes it; never returns.
    """
    a, b, c = make(Role.LISTENER), make(Role.LISTENER), make(Role.LISTENER)
    send(
        client,
        a,
        [
            event(one, "play_started"),
            event(one, "play_completed", 600),
            event(one, "next_episode_started", 600, to_episode_id=two),
            event(two, "play_started"),
            event(two, "drop_off", 150),
            event(two, "play_resumed", 150, at=DAY0 + timedelta(days=1)),
        ],
    )
    send(
        client,
        b,
        [
            event(one, "play_started"),
            event(one, "drop_off", 240),
            event(one, "play_resumed", 240, at=DAY0 + timedelta(days=7)),
        ],
    )
    send(client, c, [event(one, "play_started"), event(one, "play_completed", 600)])


def test_aggregates_match_the_seeded_dataset(
    client: TestClient,
    make: Callable[..., TestUser],
    published: dict[str, Any],
    db: Session,
    container: Container,
) -> None:
    one, two, _ = published["episodes"]
    seed(client, make, one, two)
    analytics = AnalyticsService(db, container)
    assert analytics.aggregate() == 11  # 6 + 3 + 2 events
    db.commit()
    assert analytics.aggregate() == 0  # watermark: nothing counted twice
    db.commit()

    first = analytics.episode_stats(uuid.UUID(one), None, None)
    assert (first["plays"], first["completions"], first["next_episode_starts"]) == (3, 2, 1)
    assert first["completion_rate"] == round(2 / 3, 4)
    assert first["next_episode_rate"] == 0.5
    assert first["dropoff"] == [{"minute": 4, "count": 1}]
    second = analytics.episode_stats(uuid.UUID(two), None, None)
    assert second["dropoff"] == [{"minute": 2, "count": 1}]

    retention = analytics.retention(today=date(2026, 11, 3))
    assert retention == {"d1": round(1 / 3, 4), "d7": round(1 / 3, 4), "d30": 0.0}

    db.expire_all()
    assert db.get(Series, uuid.UUID(published["series"])).play_count == 4  # type: ignore[union-attr]
    public = client.get(
        f"{API}/series/{published['series']}", headers=make(Role.LISTENER).headers
    ).json()
    assert public["play_count"] == 4


def test_admin_analytics_endpoints_and_cost_per_minute(
    client: TestClient,
    make: Callable[..., TestUser],
    published: dict[str, Any],
    db: Session,
    container: Container,
) -> None:
    admin = make(Role.ADMIN)
    one, two, _ = published["episodes"]
    seed(client, make, one, two)
    queue = container.queue
    assert isinstance(queue, InMemoryJobQueue)
    assert client.post(f"{API}/admin/analytics/refresh", headers=admin.headers).status_code == 202
    queue.run_pending()

    overview = client.get(f"{API}/admin/analytics/overview", headers=admin.headers).json()
    assert (overview["plays"], overview["completions"]) == (4, 2)
    assert set(overview["retention"]) == {"d1", "d7", "d30"}
    series = client.get(
        f"{API}/admin/analytics/series/{published['series']}", headers=admin.headers
    ).json()
    assert [(e["title"], e["plays"]) for e in series["episodes"]] == [
        ("One", 3),
        ("Two", 1),
        ("Three", 0),
    ]
    episode = client.get(f"{API}/admin/analytics/episodes/{one}", headers=admin.headers).json()
    assert episode["duration_minutes"] == 10.0
    outside = client.get(
        f"{API}/admin/analytics/overview?from=2027-01-01", headers=admin.headers
    ).json()
    assert outside["plays"] == 0 and outside["completion_rate"] is None

    db.add(
        AIUsage(
            episode_id=uuid.UUID(one),
            series_id=uuid.UUID(published["series"]),
            purpose="drafting",
            provider="fake",
            model="fake-llm",
            cost_usd=Decimal("2"),
        )
    )
    db.commit()
    costs = client.get(f"{API}/admin/costs", headers=admin.headers).json()
    assert Decimal(costs["cost_per_finished_minute_usd"]) == Decimal("0.1")  # $2 / 20 minutes
    listener = make(Role.LISTENER)
    assert (
        client.get(f"{API}/admin/analytics/overview", headers=listener.headers).status_code == 403
    )
