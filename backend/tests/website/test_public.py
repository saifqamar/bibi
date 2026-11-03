"""Public website API: published content only, no sign-in, samples never expose full episodes."""

import math
import struct
import uuid
from collections.abc import Callable
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.audio import AudioService, processing
from app.modules.audio.models import AudioAsset
from app.modules.catalog.models import Series, SeriesStatus, Shelf, ShelfItem
from app.modules.identity import Role
from app.modules.writing.models import Episode
from app.shared.jobs import InMemoryJobQueue
from tests.factories import TestUser

PUBLIC = "/api/v1/public"
STUDIO = "/api/v1/studio"
EPISODE_SECONDS = 120


def tone_mp3(seconds: int) -> bytes:
    rate = processing.SAMPLE_RATE
    frames = b"".join(
        struct.pack("<h", int(8000 * math.sin(2 * math.pi * 220 * i / rate)))
        for i in range(seconds * rate)
    )
    return processing.encode_mp3(processing.frames_to_wav(frames))


@pytest.fixture
def site(
    client: TestClient, make: Callable[..., TestUser], db: Session, container: Container
) -> dict[str, Any]:
    """A published series (two live episodes, one planned) and a draft series, on one shelf."""
    writer = make(Role.WRITER)

    def new_series(title: str) -> str:
        response = client.post(
            f"{STUDIO}/series",
            json={
                "title": title,
                "premise": f"{title} premise",
                "language": "en",
                "themes": ["sea"],
            },
            headers=writer.headers,
        )
        assert response.status_code == 201, response.text
        return str(response.json()["id"])

    live, draft = new_series("Harbour"), new_series("Unfinished")
    ids = [
        client.post(
            f"{STUDIO}/series/{live}/episodes", json={"title": t}, headers=writer.headers
        ).json()["id"]
        for t in ("Fog", "Bells", "Later")
    ]
    audio = tone_mp3(EPISODE_SECONDS)
    for episode_id in ids[:2]:
        key = f"audio/{episode_id}/full.mp3"
        container.storage.put(key, audio, "audio/mpeg")
        asset = AudioAsset(
            episode_id=uuid.UUID(episode_id),
            storage_key=key,
            format="mp3",
            duration_seconds=Decimal(EPISODE_SECONDS),
        )
        db.add(asset)
        db.flush()
        episode = db.get(Episode, uuid.UUID(episode_id))
        assert episode
        episode.published_audio_id = asset.id
        episode.published_duration_seconds = Decimal(EPISODE_SECONDS)
        episode.published_at = episode.created_at
    row = db.get(Series, uuid.UUID(live))
    assert row
    row.status = SeriesStatus.PUBLISHED
    shelf = Shelf(title="Quiet nights", kind="mood", position=1)
    db.add(shelf)
    db.flush()
    db.add_all(
        [
            ShelfItem(shelf_id=shelf.id, series_id=uuid.UUID(live), position=1),
            ShelfItem(shelf_id=shelf.id, series_id=uuid.UUID(draft), position=2),
        ]
    )
    db.commit()
    return {"live": live, "draft": draft, "episodes": ids, "shelf": str(shelf.id)}


def test_only_published_series_are_public(client: TestClient, site: dict[str, Any]) -> None:
    listing = client.get(f"{PUBLIC}/series")
    assert listing.status_code == 200
    assert listing.headers["cache-control"] == "public, max-age=60, s-maxage=300"
    assert [s["title"] for s in listing.json()["items"]] == ["Harbour"]

    detail = client.get(f"{PUBLIC}/series/{site['live']}").json()
    assert detail["series"]["is_ai_assisted"] is True
    assert detail["series"]["premise"] == "Harbour premise"
    assert [e["title"] for e in detail["episodes"]] == ["Fog", "Bells"]
    assert detail["has_sample"] is False

    assert client.get(f"{PUBLIC}/series/{site['draft']}").status_code == 404
    assert client.get(f"{PUBLIC}/series/{uuid.uuid4()}").status_code == 404

    shelves = client.get(f"{PUBLIC}/shelves").json()["items"]
    assert [[s["title"] for s in shelf["series"]] for shelf in shelves] == [["Harbour"]]
    shelf = client.get(f"{PUBLIC}/shelves/{site['shelf']}").json()
    assert [s["title"] for s in shelf["series"]] == ["Harbour"]
    assert [e["title"] for e in client.get(f"{PUBLIC}/sitemap").json()] == ["Harbour"]


def test_unpublishing_removes_the_series(
    client: TestClient, site: dict[str, Any], db: Session
) -> None:
    series = db.get(Series, uuid.UUID(site["live"]))
    assert series
    series.status = SeriesStatus.ARCHIVED
    db.commit()
    assert client.get(f"{PUBLIC}/series/{site['live']}").status_code == 404
    assert client.get(f"{PUBLIC}/sitemap").json() == []
    assert client.get(f"{PUBLIC}/shelves/{site['shelf']}").status_code == 404


def test_sample_is_a_short_clip_and_never_the_full_episode(
    client: TestClient, site: dict[str, Any], db: Session, container: Container
) -> None:
    container.settings.public_sample_seconds = 30
    assert client.get(f"{PUBLIC}/series/{site['live']}/sample").status_code == 404

    audio = AudioService(db, container)
    queue = container.queue
    assert isinstance(queue, InMemoryJobQueue)
    audio.schedule_sample(uuid.UUID(site["episodes"][1]))  # episode 2: no sample
    audio.schedule_sample(uuid.UUID(site["episodes"][0]))
    db.commit()
    assert queue.run_pending() == 1

    response = client.get(f"{PUBLIC}/series/{site['live']}/sample")
    assert response.status_code == 200, response.text
    body = response.json()
    assert 29 <= float(body["duration_seconds"]) <= 30.5
    assert body["episode_number"] == 1
    assert "/sample-" in body["url"] and "full.mp3" not in body["url"]
    assert "sig=" in body["url"]

    sample = db.scalar(select(AudioAsset).where(AudioAsset.kind == "sample"))
    assert sample is not None
    clip = processing.decode(container.storage.get(sample.storage_key))
    assert len(clip) / (processing.SAMPLE_RATE * processing.SAMPLE_WIDTH) <= 30.5
    assert client.get(f"{PUBLIC}/series/{site['live']}").json()["has_sample"] is True

    # Making it again is a no-op; a draft series has no public sample.
    assert audio.make_sample(uuid.UUID(site["episodes"][0])) is not None
    assert db.scalar(select(AudioAsset).where(AudioAsset.kind == "sample").offset(1)) is None
    assert client.get(f"{PUBLIC}/series/{site['draft']}/sample").status_code == 404


def test_public_endpoints_are_rate_limited(client: TestClient, site: dict[str, Any]) -> None:
    statuses = {client.get(f"{PUBLIC}/series").status_code for _ in range(305)}
    assert 429 in statuses
