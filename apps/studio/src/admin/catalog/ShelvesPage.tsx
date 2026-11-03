import { unwrap, type Schemas } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { errorMessage } from "@/lib/errors";

type Shelf = Schemas["AdminShelfOut"];
const key = ["admin", "shelves"];

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
}

export function ShelvesPage() {
  const queryClient = useQueryClient();
  const shelves = useQuery({ queryKey: key, queryFn: async () => unwrap(await api.GET("/api/v1/admin/shelves")) });
  const series = useQuery({ queryKey: ["admin", "series", ""], queryFn: async () => unwrap(await api.GET("/api/v1/admin/series", { params: { query: { limit: 100 } } })) });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: key });
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"mood" | "theme" | "genre">("mood");

  const create = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/shelves", { body: { title, kind } })),
    onSuccess: () => {
      setTitle("");
      refresh();
    },
  });
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => unwrap(await api.PUT("/api/v1/admin/shelves/order", { body: { shelf_ids: ids } })),
    onSuccess: refresh,
  });
  const setItems = useMutation({
    mutationFn: async ({ shelf, ids }: { shelf: Shelf; ids: string[] }) =>
      unwrap(await api.PUT("/api/v1/admin/shelves/{shelf_id}/items", { params: { path: { shelf_id: shelf.id } }, body: { series_ids: ids } })),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => unwrap(await api.DELETE("/api/v1/admin/shelves/{shelf_id}", { params: { path: { shelf_id: id } } })),
    onSuccess: refresh,
  });
  const titleOf = (id: string) => series.data?.items.find((s) => s.id === id)?.title ?? id;
  const error = create.error ?? reorder.error ?? setItems.error ?? remove.error;
  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <>
      <PageHeader title="Shelves" description="Shelves appear on the listener home in this order. Only published series are shown to listeners." />
      <form className="mb-6 flex flex-wrap gap-2" onSubmit={onCreate}>
        <Input aria-label="Shelf title" placeholder="e.g. Quiet nights" required className="max-w-xs" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select aria-label="Shelf kind" className="w-32" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="mood">Mood</option>
          <option value="theme">Theme</option>
          <option value="genre">Genre</option>
        </Select>
        <Button type="submit" disabled={create.isPending}>
          Add shelf
        </Button>
      </form>
      <FormError message={error ? errorMessage(error) : null} />
      <QueryState query={shelves}>
        {(list) => (
          <ol className="flex flex-col gap-4">
            {list.map((shelf, index) => {
              const ids = list.map((s) => s.id);
              const available = (series.data?.items ?? []).filter((s) => !shelf.series_ids.includes(s.id));
              return (
                <li key={shelf.id}>
                  <Card aria-label={`Shelf ${shelf.title}`}>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>
                        {shelf.title} <span className="text-sm font-normal text-muted-foreground">({shelf.kind})</span>
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" aria-label={`Move ${shelf.title} up`} disabled={index === 0} onClick={() => reorder.mutate(move(ids, index, -1))}>
                          ↑
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={`Move ${shelf.title} down`} disabled={index === list.length - 1} onClick={() => reorder.mutate(move(ids, index, 1))}>
                          ↓
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(shelf.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <ol className="flex flex-col gap-1">
                        {shelf.series_ids.map((id, i) => (
                          <li key={id} className="flex items-center gap-2">
                            <span className="flex-1">{titleOf(id)}</span>
                            <Button size="sm" variant="ghost" aria-label={`Move ${titleOf(id)} earlier`} disabled={i === 0} onClick={() => setItems.mutate({ shelf, ids: move(shelf.series_ids, i, -1) })}>
                              ↑
                            </Button>
                            <Button size="sm" variant="ghost" aria-label={`Remove ${titleOf(id)}`} onClick={() => setItems.mutate({ shelf, ids: shelf.series_ids.filter((x) => x !== id) })}>
                              ✕
                            </Button>
                          </li>
                        ))}
                      </ol>
                      {available.length > 0 && (
                        <Select
                          aria-label={`Add a series to ${shelf.title}`}
                          value=""
                          onChange={(e) => e.target.value && setItems.mutate({ shelf, ids: [...shelf.series_ids, e.target.value] })}
                        >
                          <option value="">Add a series…</option>
                          {available.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title} ({s.status})
                            </option>
                          ))}
                        </Select>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </QueryState>
    </>
  );
}
