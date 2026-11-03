import { unwrap } from "@bibi/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/errors";
import { seriesKeys } from "@/writer/series/queries";
import { createEntry, deleteEntry, updateEntry } from "./bibleApi";
import { EntryForm } from "./EntryForm";
import { SECTIONS, sectionByKey, type Bible, type Entry, type SectionDef } from "./sections";

function useBible(seriesId: string, q: string) {
  return useQuery({
    queryKey: [...seriesKeys.bible(seriesId), q],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/studio/series/{series_id}/bible", {
          params: { path: { series_id: seriesId }, query: q ? { q } : {} },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

function SectionPanel({ seriesId, section, bible }: { seriesId: string; section: SectionDef; bible: Bible }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Entry | "new" | null>(null);
  const [confirm, setConfirm] = useState<{ entry: Entry; references: string[] } | null>(null);
  const entries = bible[section.bibleKey] as unknown as Entry[];
  const characters = bible.characters.map((c) => ({ id: c.id, name: c.name }));
  const names = useMemo(() => new Map(characters.map((c) => [c.id, c.name])), [characters]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: seriesKeys.bible(seriesId) });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing && editing !== "new"
        ? updateEntry(seriesId, section, editing.id, payload)
        : createEntry(seriesId, section, payload),
    onSuccess: () => {
      setEditing(null);
      void refresh();
    },
  });

  const remove = useMutation({
    mutationFn: ({ entry, force }: { entry: Entry; force: boolean }) => deleteEntry(seriesId, section, entry.id, force),
    onSuccess: (result, { entry }) => {
      if (result.deleted) {
        setConfirm(null);
        void refresh();
      } else {
        setConfirm({ entry, references: result.references });
      }
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <EntryForm
          key={editing === "new" ? "new" : editing.id}
          section={section}
          entry={editing === "new" ? null : editing}
          characters={characters}
          pending={save.isPending}
          error={save.isError ? errorMessage(save.error) : null}
          onSubmit={(payload) => save.mutate(payload)}
          onCancel={() => {
            save.reset();
            setEditing(null);
          }}
        />
      ) : (
        <div>
          <Button size="sm" onClick={() => setEditing("new")}>
            Add {section.singular}
          </Button>
        </div>
      )}

      {confirm && (
        <div role="alertdialog" aria-label="Confirm delete" className="rounded-[var(--radius)] border border-warning p-4 text-sm">
          <p className="font-medium">“{section.title(confirm.entry, names)}” is still used by {confirm.references.join(", ")}.</p>
          <p className="text-muted-foreground">Deleting it also removes those entries.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => remove.mutate({ entry: confirm.entry, force: true })}>
              Delete anyway
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
          </div>
        </div>
      )}
      <FormError message={remove.isError ? errorMessage(remove.error) : null} />

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {section.label.toLowerCase()} yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="font-medium">{section.title(entry, names)}</p>
                {section.detail?.(entry, names) && <p className="line-clamp-2 text-sm text-muted-foreground">{section.detail(entry, names)}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(entry)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${section.title(entry, names)}`}
                  onClick={() => remove.mutate({ entry, force: false })}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionRoute({ seriesId, bible }: { seriesId: string; bible: Bible }) {
  const { section: key } = useParams();
  const section = sectionByKey(key);
  if (!section) return <Navigate to="../characters" replace />;
  return <SectionPanel key={section.key} seriesId={seriesId} section={section} bible={bible} />;
}

export function BibleTab({ seriesId }: { seriesId: string }) {
  const [q, setQ] = useState("");
  const query = useBible(seriesId, q.trim());
  const base = `/writer/series/${seriesId}/bible`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          The story bible is canon. The AI follows it when drafting and only changes it through proposals you accept.
        </p>
        <Input className="max-w-xs" type="search" placeholder="Search the bible" aria-label="Search the bible" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <TabNav
        label="Bible sections"
        items={SECTIONS.map((section) => ({
          to: `${base}/${section.key}`,
          label: `${section.label}${query.data ? ` (${(query.data[section.bibleKey] as unknown[]).length})` : ""}`,
        }))}
      />
      <QueryState query={query}>
        {(bible) => (
          <Routes>
            <Route index element={<Navigate to="characters" replace />} />
            <Route path=":section" element={<SectionRoute seriesId={seriesId} bible={bible} />} />
          </Routes>
        )}
      </QueryState>
    </div>
  );
}
