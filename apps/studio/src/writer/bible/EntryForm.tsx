import { useState, type FormEvent } from "react";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Entry, SectionDef } from "./sections";
import { toFormValues, toPayload } from "./sections";

export function EntryForm({
  section,
  entry,
  characters,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  section: SectionDef;
  entry: Entry | null;
  characters: { id: string; name: string }[];
  pending: boolean;
  error: string | null;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(() => toFormValues(section, entry));
  const set = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(toPayload(section, values));
  };
  const idFor = (key: string) => `${section.key}-${key}`;

  return (
    <form className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4" onSubmit={submit}>
      <p className="font-medium">{entry ? `Edit ${section.singular}` : `New ${section.singular}`}</p>
      {section.fields.map((field) => {
        const value = values[field.key];
        if (field.type === "checkbox") {
          return (
            <label key={field.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(field.key, e.target.checked)} />
              {field.label}
            </label>
          );
        }
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={idFor(field.key)}>{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                id={idFor(field.key)}
                required={field.required}
                placeholder={field.placeholder}
                value={String(value ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : field.type === "character" ? (
              <Select id={idFor(field.key)} required={field.required} value={String(value ?? "")} onChange={(e) => set(field.key, e.target.value)}>
                <option value="">Choose a character</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            ) : field.type === "thread-status" ? (
              <Select id={idFor(field.key)} value={String(value ?? "open")} onChange={(e) => set(field.key, e.target.value)}>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </Select>
            ) : (
              <Input
                id={idFor(field.key)}
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? 0 : undefined}
                required={field.required}
                placeholder={field.placeholder}
                value={String(value ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
