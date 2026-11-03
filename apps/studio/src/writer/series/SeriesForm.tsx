import { useState, type FormEvent } from "react";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface SeriesFormValues {
  title: string;
  premise: string;
  language: string;
  tone: string;
  themes: string[];
  target_episode_minutes: number;
}

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "hi", label: "Hindi" },
];

export const EMPTY_SERIES: SeriesFormValues = {
  title: "",
  premise: "",
  language: "en",
  tone: "",
  themes: [],
  target_episode_minutes: 18,
};

export function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SeriesForm({
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
}: {
  initial: SeriesFormValues;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: SeriesFormValues) => void;
}) {
  const [values, setValues] = useState(initial);
  const [themes, setThemes] = useState(initial.themes.join(", "));
  const set = <K extends keyof SeriesFormValues>(key: K, value: SeriesFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ ...values, themes: parseList(themes) });
  };

  return (
    <form className="flex max-w-2xl flex-col gap-4" onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="series-title">Title</Label>
        <Input id="series-title" required maxLength={200} value={values.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="series-premise">Premise</Label>
        <Textarea
          id="series-premise"
          rows={5}
          maxLength={5000}
          value={values.premise}
          onChange={(e) => set("premise", e.target.value)}
          placeholder="What is this story about, and why does it hold a listener for many episodes?"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="series-language">Language</Label>
          <Select id="series-language" value={values.language} onChange={(e) => set("language", e.target.value)}>
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="series-length">Target episode length (min)</Label>
          <Input
            id="series-length"
            type="number"
            min={5}
            max={60}
            value={values.target_episode_minutes}
            onChange={(e) => set("target_episode_minutes", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="series-tone">Tone</Label>
          <Input id="series-tone" maxLength={200} value={values.tone} onChange={(e) => set("tone", e.target.value)} placeholder="e.g. quiet, tense" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="series-themes">Themes</Label>
        <Input id="series-themes" value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="Comma separated, e.g. grief, family, the sea" />
      </div>
      <FormError message={error} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
