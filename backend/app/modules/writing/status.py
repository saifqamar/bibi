"""Episode status machine. Every status change goes through ``transition``."""

from app.modules.writing.models import Episode, EpisodeStatus
from app.shared.errors import Conflict

S = EpisodeStatus

ALLOWED: dict[EpisodeStatus, frozenset[EpisodeStatus]] = {
    S.PLANNED: frozenset({S.DRAFTING}),
    S.DRAFTING: frozenset({S.PLANNED, S.READY_FOR_AUDIO}),
    S.READY_FOR_AUDIO: frozenset({S.DRAFTING, S.AUDIO_READY}),
    S.AUDIO_READY: frozenset({S.DRAFTING, S.READY_FOR_AUDIO, S.IN_REVIEW}),
    # Rejected → back to ready_for_audio; request changes → changes_requested.
    S.IN_REVIEW: frozenset({S.CHANGES_REQUESTED, S.APPROVED, S.READY_FOR_AUDIO}),
    S.CHANGES_REQUESTED: frozenset({S.DRAFTING, S.READY_FOR_AUDIO, S.IN_REVIEW}),
    # Editing approved or published text starts a new draft that goes through review again.
    S.APPROVED: frozenset({S.PUBLISHED, S.DRAFTING}),
    S.PUBLISHED: frozenset({S.APPROVED, S.DRAFTING}),
}

# Transitions a writer may make directly from the Studio (the rest happen through
# drafting, audio production and review).
WRITER_MANUAL: frozenset[tuple[EpisodeStatus, EpisodeStatus]] = frozenset(
    {
        (S.PLANNED, S.DRAFTING),
        (S.DRAFTING, S.PLANNED),
        (S.DRAFTING, S.READY_FOR_AUDIO),
        (S.READY_FOR_AUDIO, S.DRAFTING),
    }
)

# Saving new text moves the episode to drafting from any of these statuses.
EDITABLE_BACK_TO_DRAFTING = frozenset(
    {S.PLANNED, S.READY_FOR_AUDIO, S.AUDIO_READY, S.CHANGES_REQUESTED, S.APPROVED, S.PUBLISHED}
)


def can_transition(current: EpisodeStatus, target: EpisodeStatus) -> bool:
    return target in ALLOWED[current]


def transition(episode: Episode, target: EpisodeStatus) -> None:
    if not can_transition(episode.status, target):
        raise Conflict(
            f"An episode cannot go from {episode.status.value} to {target.value}",
            code="invalid_status_transition",
            details={"from": episode.status.value, "to": target.value},
        )
    episode.status = target


def can_auto_publish(writer_id: object) -> bool:
    """Hook for trusted writers publishing without review ([OPEN] in spec 08; default: never)."""
    return False
