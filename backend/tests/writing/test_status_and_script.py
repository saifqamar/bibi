import itertools

import pytest

from app.modules.writing.models import Episode, EpisodeStatus
from app.modules.writing.script import estimated_seconds, parse_script, word_count
from app.modules.writing.status import ALLOWED, can_auto_publish, transition
from app.shared.errors import Conflict

S = EpisodeStatus
EXPECTED = {
    (S.PLANNED, S.DRAFTING),
    (S.DRAFTING, S.PLANNED),
    (S.DRAFTING, S.READY_FOR_AUDIO),
    (S.READY_FOR_AUDIO, S.DRAFTING),
    (S.READY_FOR_AUDIO, S.AUDIO_READY),
    (S.AUDIO_READY, S.DRAFTING),
    (S.AUDIO_READY, S.READY_FOR_AUDIO),
    (S.AUDIO_READY, S.IN_REVIEW),
    (S.IN_REVIEW, S.CHANGES_REQUESTED),
    (S.IN_REVIEW, S.APPROVED),
    (S.IN_REVIEW, S.READY_FOR_AUDIO),
    (S.CHANGES_REQUESTED, S.DRAFTING),
    (S.CHANGES_REQUESTED, S.READY_FOR_AUDIO),
    (S.CHANGES_REQUESTED, S.IN_REVIEW),
    (S.APPROVED, S.PUBLISHED),
    (S.APPROVED, S.DRAFTING),
    (S.PUBLISHED, S.APPROVED),
    (S.PUBLISHED, S.DRAFTING),
}


def test_every_status_has_rules() -> None:
    assert set(ALLOWED) == set(EpisodeStatus)


@pytest.mark.parametrize("current,target", list(itertools.product(EpisodeStatus, EpisodeStatus)))
def test_transitions_exhaustively(current: EpisodeStatus, target: EpisodeStatus) -> None:
    episode = Episode(status=current)
    if (current, target) in EXPECTED:
        transition(episode, target)
        assert episode.status == target
    else:
        with pytest.raises(Conflict) as exc:
            transition(episode, target)
        assert exc.value.code == "invalid_status_transition"
        assert exc.value.details == {"from": current.value, "to": target.value}
        assert episode.status == current


def test_auto_publish_is_off_by_default() -> None:
    assert can_auto_publish(object()) is False


def test_parse_script() -> None:
    text = """The fog came in at dusk.

Ana: Did you hear the bell?
ben: No. Go back to sleep.
Mrs Hale: Both of you, quiet.
At last: the sea was calm.

[[scene]]
Morning."""
    lines = parse_script(text, ["Ana", "Ben"])
    kinds = [(line.kind, line.speaker, line.text) for line in lines]
    assert kinds == [
        ("narration", None, "The fog came in at dusk."),
        ("dialogue", "Ana", "Did you hear the bell?"),
        ("dialogue", "Ben", "No. Go back to sleep."),
        ("narration", None, "Both of you, quiet."),
        ("narration", None, "At last: the sea was calm."),
        ("scene_break", None, ""),
        ("narration", None, "Morning."),
    ]
    assert lines[3].unknown_speaker == "Mrs Hale"
    assert lines[4].unknown_speaker is None
    assert [line.paragraph for line in lines] == [0, 1, 1, 1, 1, 2, 3]


def test_duration_estimate() -> None:
    text = " ".join(["word"] * 300) + "\n[[scene]]\n"
    assert word_count(text) == 300
    assert estimated_seconds(text) == 120
