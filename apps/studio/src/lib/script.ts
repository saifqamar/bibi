// Mirrors backend/app/modules/writing/script.py so the editor can preview and time text live.
export const SCENE_BREAK = "[[scene]]";
export const WORDS_PER_MINUTE = 150;

export interface ScriptLine {
  kind: "dialogue" | "narration" | "scene_break";
  speaker: string | null;
  text: string;
  unknownSpeaker: string | null;
}

const DIALOGUE = /^\s*([^:\n]{1,60}?)\s*:\s+(.+)$/;

function looksLikeSpeaker(label: string): boolean {
  const words = label.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 3 && words.every((w) => w[0] === w[0].toUpperCase() && /[A-Za-z]/.test(w[0]));
}

export function parseScript(text: string, characterNames: string[]): ScriptLine[] {
  const names = new Map(characterNames.filter((n) => n.trim()).map((n) => [n.trim().toLowerCase(), n]));
  const lines: ScriptLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const stripped = raw.trim();
    if (!stripped) continue;
    if (stripped.toLowerCase() === SCENE_BREAK) {
      lines.push({ kind: "scene_break", speaker: null, text: "", unknownSpeaker: null });
      continue;
    }
    const match = DIALOGUE.exec(stripped);
    if (match) {
      const label = match[1].trim();
      const spoken = match[2].trim();
      const canonical = names.get(label.toLowerCase());
      if (canonical) {
        lines.push({ kind: "dialogue", speaker: canonical, text: spoken, unknownSpeaker: null });
        continue;
      }
      if (looksLikeSpeaker(label)) {
        lines.push({ kind: "narration", speaker: null, text: spoken, unknownSpeaker: label });
        continue;
      }
    }
    lines.push({ kind: "narration", speaker: null, text: stripped, unknownSpeaker: null });
  }
  return lines;
}

export function wordCount(text: string): number {
  const cleaned = text.split(SCENE_BREAK).join(" ").trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

export function estimatedSeconds(text: string): number {
  return Math.round((wordCount(text) / WORDS_PER_MINUTE) * 60);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
