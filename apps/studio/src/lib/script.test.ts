import { describe, expect, it } from "vitest";
import { estimatedSeconds, formatDuration, parseScript, wordCount } from "./script";

describe("script helpers (match the backend parser)", () => {
  it("parses dialogue, narration, unknown speakers and scene breaks", () => {
    const lines = parseScript("The fog came.\n\nAna: Hello?\nben: Hush.\nMrs Hale: Quiet.\nAt last: calm.\n[[scene]]\nMorning.", ["Ana", "Ben"]);
    expect(lines.map((l) => [l.kind, l.speaker, l.text, l.unknownSpeaker])).toEqual([
      ["narration", null, "The fog came.", null],
      ["dialogue", "Ana", "Hello?", null],
      ["dialogue", "Ben", "Hush.", null],
      ["narration", null, "Quiet.", "Mrs Hale"],
      ["narration", null, "At last: calm.", null],
      ["scene_break", null, "", null],
      ["narration", null, "Morning.", null],
    ]);
  });

  it("estimates duration at 150 words per minute", () => {
    const text = Array(300).fill("word").join(" ") + "\n[[scene]]\n";
    expect(wordCount(text)).toBe(300);
    expect(estimatedSeconds(text)).toBe(120);
    expect(formatDuration(125)).toBe("2:05");
  });
});
