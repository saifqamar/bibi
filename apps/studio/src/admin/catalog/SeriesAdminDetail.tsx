import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";

type Access = "series" | "free" | "paid";
const toAccess = (value: boolean | null | undefined): Access => (value == null ? "series" : value ? "free" : "paid");

export function SeriesAdminDetail() {
  const { seriesId = "" } = useParams();
  const queryClient = useQueryClient();
  const seriesKey = ["admin", "series-detail", seriesId];
  const episodesKey = ["admin", "series-episodes", seriesId];
  const series = useQuery({
    queryKey: seriesKey,
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/series/{series_id}", { params: { path: { series_id: seriesId } } })),
  });
  const episodes = useQuery({
    queryKey: episodesKey,
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/series/{series_id}/episodes", { params: { path: { series_id: seriesId } } })),
  });
  const writers = useQuery({ queryKey: ["admin", "writers"], queryFn: async () => unwrap(await api.GET("/api/v1/admin/writers", { params: { query: { limit: 100 } } })) });
  const [freeCount, setFreeCount] = useState<number | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async (body: { free_episode_count?: number; owner_writer_id?: string; archived?: boolean }) =>
      unwrap(await api.PUT("/api/v1/admin/series/{series_id}", { params: { path: { series_id: seriesId } }, body })),
    onSuccess: (data) => queryClient.setQueryData(seriesKey, data),
  });
  const cover = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return unwrap(
        await api.POST("/api/v1/admin/series/{series_id}/cover", {
          params: { path: { series_id: seriesId } },
          body: form as never,
          bodySerializer: (b) => b as unknown as FormData,
        }),
      );
    },
    onSuccess: (data) => queryClient.setQueryData(seriesKey, data),
  });
  const access = useMutation({
    mutationFn: async ({ episodeId, value }: { episodeId: string; value: Access }) =>
      unwrap(
        await api.PUT("/api/v1/admin/episodes/{episode_id}/access", {
          params: { path: { episode_id: episodeId } },
          body: { is_free: value === "series" ? null : value === "free" },
        }),
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: episodesKey }),
  });
  const error = update.error ?? cover.error ?? access.error;

  return (
    <QueryState query={series}>
      {(s) => (
        <>
          <Link to="/admin/series" className="text-sm text-primary hover:underline">
            ← Series
          </Link>
          <PageHeader title={s.title} actions={<StatusBadge status={s.status} />} />
          <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="free-count">Free episodes</Label>
                  <Input id="free-count" type="number" min={0} className="w-28" value={freeCount ?? s.free_episode_count} onChange={(e) => setFreeCount(Number(e.target.value))} />
                </div>
                <div className="flex min-w-56 flex-col gap-1.5">
                  <Label htmlFor="owner">Writer</Label>
                  <Select id="owner" value={owner ?? s.owner_writer_id ?? ""} onChange={(e) => setOwner(e.target.value)}>
                    {(writers.data?.items ?? []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({
                      ...(freeCount !== null ? { free_episode_count: freeCount } : {}),
                      ...(owner && owner !== s.owner_writer_id ? { owner_writer_id: owner } : {}),
                    })
                  }
                >
                  Save
                </Button>
                <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ archived: s.status !== "archived" })}>
                  {s.status === "archived" ? "Unarchive" : "Archive"}
                </Button>
              </div>
              <FormError message={error ? errorMessage(error) : null} />
              <QueryState query={episodes}>
                {(items) => (
                  <Table aria-label="Episode access">
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Episode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((episode) => (
                        <TableRow key={episode.id}>
                          <TableCell>{episode.number}</TableCell>
                          <TableCell>{episode.title || "Untitled"}</TableCell>
                          <TableCell>
                            <StatusBadge status={episode.status} />
                          </TableCell>
                          <TableCell>
                            <Select
                              aria-label={`Access for episode ${episode.number}`}
                              value={toAccess(episode.is_free)}
                              onChange={(e) => access.mutate({ episodeId: episode.id, value: e.target.value as Access })}
                            >
                              <option value="series">Series default ({episode.number <= s.free_episode_count ? "free" : "paid"})</option>
                              <option value="free">Free</option>
                              <option value="paid">Paid</option>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </QueryState>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-cover">Cover</Label>
              <div className="aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-muted">
                {s.cover_url && <img src={s.cover_url} alt={`Cover for ${s.title}`} className="h-full w-full object-cover" />}
              </div>
              <input id="admin-cover" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={(e) => e.target.files?.[0] && cover.mutate(e.target.files[0])} />
            </div>
          </div>
        </>
      )}
    </QueryState>
  );
}
