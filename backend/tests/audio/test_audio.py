"""Voice library, casting and episode audio production with the fake TTS and real ffmpeg."""

from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.ai.adapters.fakes import CHARS_PER_SECOND, FakeTTS
from app.modules.ai.models import AIUsage
from app.modules.audio import processing
from app.modules.identity import Role
from app.shared.jobs import QUEUE_VOICE, InMemoryJobQueue
from tests.factories import TestUser

STUDIO = "/api/v1/studio"
ADMIN = "/api/v1/admin"

pytestmark = pytest.mark.skipif(not processing.ffmpeg_available(), reason="ffmpeg is required")


@pytest.fixture
def writer(make: Callable[..., TestUser]) -> TestUser:
    return make(Role.WRITER)


@pytest.fixture
def admin(make: Callable[..., TestUser]) -> TestUser:
    return make(Role.ADMIN)


@pytest.fixture
def queue(container: Container) -> InMemoryJobQueue:
    assert isinstance(container.queue, InMemoryJobQueue)
    return container.queue


@pytest.fixture
def tts(container: Container) -> FakeTTS:
    fake = FakeTTS()
    container.tts = fake
    return fake


def voice(client: TestClient, admin: TestUser, name: str) -> str:
    response = client.post(
        f"{ADMIN}/voices",
        json={
            "provider": "fake",
            "provider_voice_id": f"fake-{name.lower()}",
            "name": name,
        },
        headers=admin.headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def setup_episode(
    client: TestClient, writer: TestUser, admin: TestUser, text: str
) -> dict[str, Any]:
    narrator, ana_voice = voice(client, admin, "Warm"), voice(client, admin, "Bright")
    series = client.post(
        f"{STUDIO}/series",
        json={"title": "Harbour", "language": "en", "themes": []},
        headers=writer.headers,
    ).json()
    ana = client.post(
        f"{STUDIO}/series/{series['id']}/characters",
        json={"name": "Ana", "voice_notes": "young, quick"},
        headers=writer.headers,
    ).json()
    client.post(
        f"{STUDIO}/series/{series['id']}/characters", json={"name": "Ben"}, headers=writer.headers
    )
    cast = client.put(
        f"{STUDIO}/series/{series['id']}/voice-assignments",
        json={
            "assignments": [
                {"character_id": None, "voice_id": narrator},
                {"character_id": ana["id"], "voice_id": ana_voice},
            ]
        },
        headers=writer.headers,
    )
    assert cast.status_code == 200, cast.text
    episode = client.post(
        f"{STUDIO}/series/{series['id']}/episodes", json={"title": "Night"}, headers=writer.headers
    ).json()
    client.post(
        f"{STUDIO}/episodes/{episode['id']}/drafts",
        json={"text": text, "base_version": None},
        headers=writer.headers,
    )
    for target in ("ready_for_audio",):
        response = client.post(
            f"{STUDIO}/episodes/{episode['id']}/status",
            json={"status": target},
            headers=writer.headers,
        )
        assert response.status_code == 200, response.text
    return {
        "series": series,
        "episode": episode,
        "ana": ana,
        "narrator": narrator,
        "ana_voice": ana_voice,
    }


def render(client: TestClient, writer: TestUser, queue: InMemoryJobQueue, episode_id: str) -> dict:
    response = client.post(f"{STUDIO}/episodes/{episode_id}/audio", headers=writer.headers)
    assert response.status_code == 202, response.text
    assert [j.queue for j in queue.jobs] == [QUEUE_VOICE]  # never the drafting queue
    queue.run_pending(QUEUE_VOICE)
    return client.get(f"{STUDIO}/episodes/{episode_id}/audio", headers=writer.headers).json()


SHORT = "The fog came in.\n\nAna: Did you hear the bell?\nBen: Go to sleep.\n[[scene]]\nMorning."


def long_script() -> str:
    """About sixteen minutes at the fake TTS speaking rate."""
    lines = []
    for i in range(160):
        sentence = (
            f"Line {i:03d} carries the story on, one patient image after another, slowly, quietly."
        )
        lines.append(f"Ana: {sentence}" if i % 3 == 0 else sentence)
        if i % 8 == 7:
            lines.append("")
        if i % 40 == 39:
            lines.append("[[scene]]")
    return "\n".join(lines)


def test_sixteen_minute_episode_renders_to_target_loudness(
    client: TestClient,
    writer: TestUser,
    admin: TestUser,
    queue: InMemoryJobQueue,
    tts: FakeTTS,
    db: Session,
) -> None:
    text = long_script()
    ids = setup_episode(client, writer, admin, text)
    audio = render(client, writer, queue, ids["episode"]["id"])

    assert audio["render"]["status"] == "succeeded"
    assert audio["render"]["lines_done"] == audio["render"]["lines_total"] == 160
    asset = audio["asset"]
    speech_seconds = sum(len(text) for text, _voice in tts.calls) / CHARS_PER_SECOND
    assert 15 * 60 < float(asset["duration_seconds"]) < 18 * 60
    assert float(asset["duration_seconds"]) > speech_seconds  # pauses were added
    assert abs(float(asset["loudness_lufs"]) - (-16.0)) <= 1.0
    assert float(asset["peak_dbfs"]) <= -1.5
    assert asset["format"] == "mp3" and "sig=" in asset["url"]
    assert audio["is_current"] is True

    episode = client.get(f"{STUDIO}/episodes/{ids['episode']['id']}", headers=writer.headers).json()
    assert episode["status"] == "audio_ready"

    # Dialogue used Ana's voice, narration the narrator's.
    voices = {line["voice_id"] for line in audio["lines"] if line["speaker"] == "Ana"}
    assert voices == {ids["ana_voice"]}
    assert {c[1] for c in tts.calls} == {"fake-warm", "fake-bright"}

    chars = db.scalar(select(func.sum(AIUsage.tts_characters)).where(AIUsage.purpose == "tts"))
    assert chars == sum(len(c[0]) for c in tts.calls)


def test_failing_line_keeps_the_rest_and_retry_only_redoes_it(
    client: TestClient, writer: TestUser, admin: TestUser, queue: InMemoryJobQueue, tts: FakeTTS
) -> None:
    ids = setup_episode(client, writer, admin, SHORT)
    tts.fail_texts = {"Go to sleep."}
    audio = render(client, writer, queue, ids["episode"]["id"])
    assert audio["render"]["status"] == "failed"
    assert "1 line(s) failed" in audio["render"]["error"]
    statuses = {line["text"]: line["status"] for line in audio["lines"]}
    assert statuses["Go to sleep."] == "failed"
    assert statuses["Did you hear the bell?"] == "done"
    episode = client.get(f"{STUDIO}/episodes/{ids['episode']['id']}", headers=writer.headers).json()
    assert episode["status"] == "ready_for_audio"

    tts.fail_texts = set()
    calls_before = len(tts.calls)
    retried = client.post(
        f"{STUDIO}/audio-renders/{audio['render']['id']}/retry", headers=writer.headers
    )
    assert retried.status_code == 202
    queue.run_pending(QUEUE_VOICE)
    assert [c[0] for c in tts.calls[calls_before:]] == ["Go to sleep."]
    audio = client.get(
        f"{STUDIO}/episodes/{ids['episode']['id']}/audio", headers=writer.headers
    ).json()
    assert audio["render"]["status"] == "succeeded"


def test_line_tools_only_resynthesize_what_changed(
    client: TestClient, writer: TestUser, admin: TestUser, queue: InMemoryJobQueue, tts: FakeTTS
) -> None:
    ids = setup_episode(client, writer, admin, SHORT)
    audio = render(client, writer, queue, ids["episode"]["id"])
    first_asset = audio["asset"]["id"]
    bell = next(line for line in audio["lines"] if line["text"] == "Did you hear the bell?")

    calls = len(tts.calls)
    client.post(f"{STUDIO}/audio-lines/{bell['id']}/regenerate", headers=writer.headers)
    queue.run_pending(QUEUE_VOICE)
    assert [c[0] for c in tts.calls[calls:]] == ["Did you hear the bell?"]
    audio = client.get(
        f"{STUDIO}/episodes/{ids['episode']['id']}/audio", headers=writer.headers
    ).json()
    assert audio["asset"]["id"] != first_asset

    # Fixing one line's text saves a new version and re-records only that line.
    bell = next(line for line in audio["lines"] if line["text"] == "Did you hear the bell?")
    calls = len(tts.calls)
    response = client.put(
        f"{STUDIO}/audio-lines/{bell['id']}",
        json={"text": "Do you hear it?"},
        headers=writer.headers,
    )
    assert response.status_code == 202, response.text
    queue.run_pending(QUEUE_VOICE)
    assert [c[0] for c in tts.calls[calls:]] == ["Do you hear it?"]
    draft = client.get(
        f"{STUDIO}/episodes/{ids['episode']['id']}/drafts/2", headers=writer.headers
    ).json()
    assert "Ana: Do you hear it?" in draft["text"] and draft["source"] == "human"
    episode = client.get(f"{STUDIO}/episodes/{ids['episode']['id']}", headers=writer.headers).json()
    assert episode["status"] == "audio_ready"
    audio = client.get(
        f"{STUDIO}/episodes/{ids['episode']['id']}/audio", headers=writer.headers
    ).json()
    assert audio["is_current"] is True

    # Swapping Ben's voice re-records only Ben's line.
    ben_voice = voice(client, admin, "Low")
    cast = client.get(
        f"{STUDIO}/series/{ids['series']['id']}/voice-assignments", headers=writer.headers
    ).json()["cast"]
    ben = next(m for m in cast if m["name"] == "Ben")
    client.put(
        f"{STUDIO}/series/{ids['series']['id']}/voice-assignments",
        json={
            "assignments": [
                {"character_id": None, "voice_id": ids["narrator"]},
                {"character_id": ids["ana"]["id"], "voice_id": ids["ana_voice"]},
                {"character_id": ben["character_id"], "voice_id": ben_voice},
            ]
        },
        headers=writer.headers,
    )
    calls = len(tts.calls)
    render(client, writer, queue, ids["episode"]["id"])
    assert [c[0] for c in tts.calls[calls:]] == ["Go to sleep."]


def test_unknown_and_unassigned_speakers_use_the_narrator(
    client: TestClient, writer: TestUser, admin: TestUser, queue: InMemoryJobQueue, tts: FakeTTS
) -> None:
    ids = setup_episode(client, writer, admin, "Stranger: Who goes there?\nBen: Only me.")
    audio = render(client, writer, queue, ids["episode"]["id"])
    flags = {line["text"]: (line["flag"], line["voice_id"]) for line in audio["lines"]}
    assert flags["Who goes there?"] == ("unknown_speaker", ids["narrator"])
    assert flags["Only me."] == ("no_voice_assigned", ids["narrator"])


def test_guards_and_scoping(
    client: TestClient,
    writer: TestUser,
    admin: TestUser,
    queue: InMemoryJobQueue,
    make: Callable[..., TestUser],
    tts: FakeTTS,
) -> None:
    ids = setup_episode(client, writer, admin, SHORT)
    episode_id = ids["episode"]["id"]
    other = make(Role.WRITER)
    assert (
        client.post(f"{STUDIO}/episodes/{episode_id}/audio", headers=other.headers).status_code
        == 404
    )
    assert (
        client.get(
            f"{STUDIO}/series/{ids['series']['id']}/voice-assignments", headers=other.headers
        ).status_code
        == 404
    )

    client.post(f"{STUDIO}/episodes/{episode_id}/audio", headers=writer.headers)
    busy = client.post(f"{STUDIO}/episodes/{episode_id}/audio", headers=writer.headers)
    assert busy.json()["error"]["code"] == "render_in_progress"
    queue.jobs.clear()

    client.put(
        f"{STUDIO}/series/{ids['series']['id']}/voice-assignments",
        json={"assignments": []},
        headers=writer.headers,
    )
    new_episode = client.post(
        f"{STUDIO}/series/{ids['series']['id']}/episodes", json={}, headers=writer.headers
    ).json()
    not_ready = client.post(f"{STUDIO}/episodes/{new_episode['id']}/audio", headers=writer.headers)
    assert not_ready.json()["error"]["code"] == "episode_not_ready_for_audio"

    bad_voice = client.put(
        f"{STUDIO}/series/{ids['series']['id']}/voice-assignments",
        json={"assignments": [{"character_id": None, "voice_id": ids["series"]["id"]}]},
        headers=writer.headers,
    )
    assert bad_voice.json()["error"]["code"] == "unknown_voice"
    assert (
        client.post(
            f"{ADMIN}/voices",
            json={"provider": "x", "provider_voice_id": "y", "name": "z"},
            headers=writer.headers,
        ).status_code
        == 403
    )


def test_deleting_a_cast_character_needs_confirmation(
    client: TestClient, writer: TestUser, admin: TestUser, tts: FakeTTS
) -> None:
    ids = setup_episode(client, writer, admin, SHORT)
    response = client.delete(
        f"{STUDIO}/series/{ids['series']['id']}/characters/{ids['ana']['id']}",
        headers=writer.headers,
    )
    assert response.status_code == 409
    assert "a voice assignment" in response.json()["error"]["details"]["references"]


def test_voice_preview_is_generated_in_the_background(
    client: TestClient, writer: TestUser, admin: TestUser, queue: InMemoryJobQueue, tts: FakeTTS
) -> None:
    voice_id = voice(client, admin, "Warm")
    first = client.get(f"{STUDIO}/voices/{voice_id}/preview", headers=writer.headers)
    assert first.status_code == 202 and first.json()["url"] is None
    queue.run_pending(QUEUE_VOICE)
    ready = client.get(f"{STUDIO}/voices/{voice_id}/preview", headers=writer.headers)
    assert ready.status_code == 200 and ready.json()["url"].startswith("http://testserver/media/")
    media = client.get(ready.json()["url"].replace("http://testserver", ""))
    assert media.headers["content-type"] == "audio/mpeg"
    listed = client.get(f"{STUDIO}/voices", headers=writer.headers).json()
    assert [v["name"] for v in listed] == ["Warm"]
    client.put(f"{ADMIN}/voices/{voice_id}", json={"is_active": False}, headers=admin.headers)
    assert client.get(f"{STUDIO}/voices", headers=writer.headers).json() == []
    assert len(client.get(f"{ADMIN}/voices", headers=admin.headers).json()) == 1
