"""Prompt templates. Bump a version when its wording changes, so traces can be compared."""

import json
from typing import Any

DRAFT_VERSION = "draft-v1"
REGENERATE_VERSION = "regenerate-v1"
CANON_VERSION = "canon-v1"
SUMMARY_VERSION = "summary-v1"

SCRIPT_FORMAT = """Write the episode as an audio script:
- Narration is plain prose on its own lines.
- Dialogue lines start with the speaking character's exact bible name and a colon, e.g. "Ana: ...".
- Put [[scene]] on its own line between scenes.
- No stage directions in brackets, no markdown, no headings."""

DRAFT_SYSTEM = f"""You draft episodes of serialized audio dramas for mature listeners who enjoy
the depth of novels. A human writer owns the story: follow their beats in order and never
contradict the story bible, which is canon. If a beat seems to conflict with canon, keep canon
and write the beat as closely as canon allows.

Write with depth rather than cliffhanger tricks: patient scenes, specific sensory detail, and
dialogue that sounds natural when read aloud by voice actors. Keep each character's voice
consistent with the bible.

{SCRIPT_FORMAT}"""


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def draft_user_prompt(
    *,
    series: dict[str, Any],
    episode_number: int,
    episode_title: str,
    beats: list[str],
    notes: str,
    bible: dict[str, Any],
    previous: list[dict[str, Any]],
    target_words: int,
) -> str:
    beat_lines = "\n".join(f"{i}. {b}" for i, b in enumerate(beats, start=1))
    previous_text = (
        "\n".join(f"Episode {p['number']} ({p['title']}): {p['summary']}" for p in previous)
        or "This is the first episode."
    )
    return f"""<series>{_json(series)}</series>
<story_bible>{_json(bible)}</story_bible>
<earlier_episodes>
{previous_text}
</earlier_episodes>

Draft episode {episode_number}{f' "{episode_title}"' if episode_title else ""}.
Aim for about {target_words} words (the series targets this listening length).

Beats, in order:
{beat_lines}

Writer's notes: {notes or "none"}

Return only the script."""


REGENERATE_SYSTEM = f"""You revise one passage of an audio drama script. Keep the story, canon and
characters consistent with the surrounding text, apply the writer's note, and match the length of
the original passage unless the note asks otherwise.

{SCRIPT_FORMAT}

Return only the replacement passage."""


def regenerate_user_prompt(*, before: str, passage: str, after: str, note: str) -> str:
    return f"""<before>{before}</before>
<passage>{passage}</passage>
<after>{after}</after>

Writer's note for the passage: {note or "Improve it."}"""


CANON_SYSTEM = """You maintain the story bible (canon) of a serialized audio drama. Given the bible
and an approved episode, list only changes the episode makes to canon: new characters, locations
or rules; new facts about existing entries; timeline events; plot threads opened or resolved.
Do not restate what the bible already says. Each proposal must cite the reason from the episode.
The writer reviews every proposal before it changes canon."""

PROPOSAL_ENTITY_TYPES = [
    "characters",
    "relationships",
    "locations",
    "world-rules",
    "timeline",
    "plot-threads",
]

CANON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "proposals": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "entity_type": {"type": "string", "enum": PROPOSAL_ENTITY_TYPES},
                    "op": {"type": "string", "enum": ["create", "update", "delete"]},
                    "entity_id": {"type": ["string", "null"]},
                    "payload": {"type": "object"},
                    "reason": {"type": "string"},
                },
                "required": ["entity_type", "op", "entity_id", "payload", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["proposals"],
    "additionalProperties": False,
}


def canon_user_prompt(*, bible: dict[str, Any], episode_number: int, text: str) -> str:
    return f"""<story_bible>{_json(bible)}</story_bible>
<episode number="{episode_number}">
{text}
</episode>

Field names per entity type: characters (name, description, traits, voice_notes),
relationships (character_a_id, character_b_id, description, from_episode),
locations (name, description), world-rules (rule_text),
timeline (description, episode_number, story_time),
plot-threads (title, description, status: open|resolved, opened_in_episode,
resolved_in_episode).
For update and delete, entity_id is the bible entry's id; for create it is null."""


SUMMARY_SYSTEM = """Summarize an audio drama episode for the writers' continuity notes: who did
what, what changed, what was revealed, and what is left open. 120 to 200 words, plain prose,
past tense."""


def summary_user_prompt(*, episode_number: int, text: str) -> str:
    return f'<episode number="{episode_number}">\n{text}\n</episode>'
