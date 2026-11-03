import type { Schemas } from "@bibi/api-client";

export type Bible = Schemas["BibleOut"];
export type Entry = Record<string, unknown> & { id: string };

export type FieldType = "text" | "textarea" | "tags" | "number" | "checkbox" | "character" | "thread-status";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

export interface SectionDef {
  /** URL segment, matches the API path. */
  key: "characters" | "relationships" | "locations" | "world-rules" | "timeline" | "plot-threads";
  bibleKey: keyof Bible;
  label: string;
  singular: string;
  fields: FieldDef[];
  title: (entry: Entry, names: Map<string, string>) => string;
  detail?: (entry: Entry, names: Map<string, string>) => string;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

export const SECTIONS: SectionDef[] = [
  {
    key: "characters",
    bibleKey: "characters",
    label: "Characters",
    singular: "character",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "traits", label: "Traits", type: "tags", placeholder: "Comma separated" },
      { key: "voice_notes", label: "Voice notes", type: "textarea", placeholder: "Age, accent, pace, texture" },
      { key: "is_narrator", label: "This is the narrator", type: "checkbox" },
    ],
    title: (e) => `${text(e.name)}${e.is_narrator ? " (narrator)" : ""}`,
    detail: (e) => text(e.description),
  },
  {
    key: "relationships",
    bibleKey: "relationships",
    label: "Relationships",
    singular: "relationship",
    fields: [
      { key: "character_a_id", label: "Character", type: "character", required: true },
      { key: "character_b_id", label: "Related to", type: "character", required: true },
      { key: "description", label: "How they relate", type: "textarea" },
      { key: "from_episode", label: "Since episode", type: "number" },
    ],
    title: (e, names) => `${names.get(text(e.character_a_id)) ?? "?"} ↔ ${names.get(text(e.character_b_id)) ?? "?"}`,
    detail: (e) => text(e.description),
  },
  {
    key: "locations",
    bibleKey: "locations",
    label: "Locations",
    singular: "location",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
    title: (e) => text(e.name),
    detail: (e) => text(e.description),
  },
  {
    key: "world-rules",
    bibleKey: "world_rules",
    label: "World rules",
    singular: "rule",
    fields: [{ key: "rule_text", label: "Rule", type: "textarea", required: true }],
    title: (e) => text(e.rule_text),
  },
  {
    key: "timeline",
    bibleKey: "timeline",
    label: "Timeline",
    singular: "event",
    fields: [
      { key: "description", label: "What happens", type: "textarea", required: true },
      { key: "story_time", label: "Story time", type: "text", placeholder: "e.g. Winter 1952, day 3" },
      { key: "episode_number", label: "Episode", type: "number" },
      { key: "position", label: "Order", type: "number" },
    ],
    title: (e) => text(e.description),
    detail: (e) => [text(e.story_time), e.episode_number ? `episode ${e.episode_number}` : ""].filter(Boolean).join(" · "),
  },
  {
    key: "plot-threads",
    bibleKey: "plot_threads",
    label: "Plot threads",
    singular: "plot thread",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "thread-status" },
      { key: "opened_in_episode", label: "Opened in episode", type: "number" },
      { key: "resolved_in_episode", label: "Resolved in episode", type: "number" },
    ],
    title: (e) => text(e.title),
    detail: (e) => `${text(e.status)}${e.opened_in_episode ? ` · from episode ${e.opened_in_episode}` : ""}`,
  },
];

export function sectionByKey(key: string | undefined): SectionDef | undefined {
  return SECTIONS.find((section) => section.key === key);
}

/** Turns form strings into API values (tags → list, empty numbers → null). */
export function toPayload(section: SectionDef, raw: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of section.fields) {
    const value = raw[field.key];
    if (field.type === "tags") {
      payload[field.key] = String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (field.type === "number") {
      payload[field.key] = value === "" || value === undefined || value === null ? null : Number(value);
    } else if (field.type === "checkbox") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "thread-status") {
      payload[field.key] = value || "open";
    } else {
      payload[field.key] = value ?? "";
    }
  }
  return payload;
}

export function toFormValues(section: SectionDef, entry: Entry | null): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of section.fields) {
    const value = entry?.[field.key];
    if (field.type === "tags") values[field.key] = Array.isArray(value) ? value.join(", ") : "";
    else if (field.type === "number") values[field.key] = value ?? "";
    else if (field.type === "checkbox") values[field.key] = Boolean(value);
    else values[field.key] = value ?? (field.type === "thread-status" ? "open" : "");
  }
  return values;
}
