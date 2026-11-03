"""Script format used by the editor, the AI drafts and voice production.

- ``Name: line`` is dialogue when ``Name`` matches a character (case-insensitive).
- Any other non-empty line is narration.
- A line containing only ``[[scene]]`` is a scene break.
- Blank lines separate paragraphs.
"""

import re
from dataclasses import dataclass
from typing import Literal

SCENE_BREAK = "[[scene]]"
WORDS_PER_MINUTE = 150
_DIALOGUE = re.compile(r"^\s*([^:\n]{1,60}?)\s*:\s+(.+)$")
_WORD = re.compile(r"\S+")

LineKind = Literal["dialogue", "narration", "scene_break"]


@dataclass(frozen=True)
class ScriptLine:
    index: int
    kind: LineKind
    speaker: str | None  # canonical character name for dialogue
    text: str
    paragraph: int
    unknown_speaker: str | None = None  # "Name:" prefix that matched no character
    source_line: int = 0  # 0-based line number in the draft text


def parse_script(text: str, character_names: list[str]) -> list[ScriptLine]:
    names = {name.strip().lower(): name for name in character_names if name.strip()}
    lines: list[ScriptLine] = []
    paragraph = 0
    previous_blank = True
    for line_no, raw in enumerate(text.splitlines()):
        stripped = raw.strip()
        if not stripped:
            if not previous_blank:
                paragraph += 1
            previous_blank = True
            continue
        previous_blank = False
        index = len(lines)
        if stripped.lower() == SCENE_BREAK:
            lines.append(ScriptLine(index, "scene_break", None, "", paragraph, source_line=line_no))
            paragraph += 1
            previous_blank = True
            continue
        match = _DIALOGUE.match(stripped)
        if match:
            label, spoken = match.group(1).strip(), match.group(2).strip()
            canonical = names.get(label.lower())
            if canonical:
                lines.append(
                    ScriptLine(index, "dialogue", canonical, spoken, paragraph, source_line=line_no)
                )
                continue
            if _looks_like_speaker(label):
                lines.append(
                    ScriptLine(
                        index,
                        "narration",
                        None,
                        spoken,
                        paragraph,
                        unknown_speaker=label,
                        source_line=line_no,
                    )
                )
                continue
        lines.append(ScriptLine(index, "narration", None, stripped, paragraph, source_line=line_no))
    return lines


def _looks_like_speaker(label: str) -> bool:
    # "Mrs Hale: ..." looks like a speaker tag; "At last: the sea" does not.
    words = label.split()
    return 0 < len(words) <= 3 and all(w[:1].isupper() for w in words)


def word_count(text: str) -> int:
    return len(_WORD.findall(text.replace(SCENE_BREAK, " ")))


def estimated_seconds(text: str) -> int:
    return round(word_count(text) / WORDS_PER_MINUTE * 60)
