import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { DropoffChart, type DropoffPoint } from "./DropoffChart";

interface Totals {
  plays: number;
  completions: number;
  next_episode_starts: number;
  completion_rate: number | null;
  next_episode_rate: number | null;
}
interface Overview extends Totals {
  retention: { d1: number | null; d7: number | null; d30: number | null };
}
interface EpisodeRow extends Totals {
  episode_id: string;
  number: number;
  title: string;
}
interface SeriesStats extends Totals {
  episodes: EpisodeRow[];
}
interface EpisodeStats extends Totals {
  title: string;
  number: number;
  duration_minutes: number | null;
  dropoff: DropoffPoint[];
}

const pct = (value: number | null | undefined) => (value == null ? "—" : `${Math.round(value * 100)}%`);

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState({ from: "", to: "" });
  const [seriesId, setSeriesId] = useState("");
  const [episodeId, setEpisodeId] = useState("");
  const rangeQuery = Object.fromEntries(Object.entries(range).filter(([, v]) => v));

  const overview = useQuery({
    queryKey: ["admin", "analytics", "overview", range],
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/analytics/overview", { params: { query: rangeQuery } })) as unknown as Overview,
  });
  const seriesList = useQuery({
    queryKey: ["admin", "series", "published"],
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/series", { params: { query: { limit: 100 } } })),
  });
  const series = useQuery({
    queryKey: ["admin", "analytics", "series", seriesId, range],
    enabled: Boolean(seriesId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/admin/analytics/series/{series_id}", { params: { path: { series_id: seriesId }, query: rangeQuery } })) as unknown as SeriesStats,
  });
  const episode = useQuery({
    queryKey: ["admin", "analytics", "episode", episodeId, range],
    enabled: Boolean(episodeId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/admin/analytics/episodes/{episode_id}", { params: { path: { episode_id: episodeId }, query: rangeQuery } })) as unknown as EpisodeStats,
  });
  const refresh = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/analytics/refresh")),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] }),
  });

  return (
    <>
      <PageHeader
        title="Listening analytics"
        description="Updated every 15 minutes from listening events."
        actions={
          <Button variant="outline" size="sm" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
            Update now
          </Button>
        }
      />
      {/* Filters in one row above the charts */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="an-from">From</Label>
          <Input id="an-from" type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="an-to">To</Label>
          <Input id="an-to" type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
        <div className="flex min-w-56 flex-col gap-1.5">
          <Label htmlFor="an-series">Series</Label>
          <Select
            id="an-series"
            value={seriesId}
            onChange={(e) => {
              setSeriesId(e.target.value);
              setEpisodeId("");
            }}
          >
            <option value="">Choose a series</option>
            {(seriesList.data?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <QueryState query={overview}>
        {(o) => (
          <section aria-label="Key metrics" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Tile label="Plays" value={formatNumber(o.plays)} />
            <Tile label="Completion rate" value={pct(o.completion_rate)} hint={`${formatNumber(o.completions)} finished`} />
            <Tile label="Next-episode rate" value={pct(o.next_episode_rate)} hint="of finishers start the next" />
            <Tile label="Day-1 return" value={pct(o.retention.d1)} />
            <Tile label="Day-7 return" value={pct(o.retention.d7)} />
            <Tile label="Day-30 return" value={pct(o.retention.d30)} />
          </section>
        )}
      </QueryState>

      {seriesId && (
        <QueryState query={series}>
          {(s) => (
            <section aria-label="Episodes" className="mb-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Episode</TableHead>
                    <TableHead className="text-right">Plays</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead className="text-right">Next episode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.episodes.map((e) => (
                    <TableRow key={e.episode_id} className={e.episode_id === episodeId ? "bg-muted" : undefined}>
                      <TableCell>
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEpisodeId(e.episode_id)}>
                          {e.number}. {e.title || "Untitled"}
                        </button>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.plays)}</TableCell>
                      <TableCell className="text-right tabular-nums">{pct(e.completion_rate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{pct(e.next_episode_rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}
        </QueryState>
      )}

      {episodeId && (
        <QueryState query={episode}>
          {(e) => (
            <section aria-label="Drop-off">
              <h2 className="mb-2 font-semibold">
                Drop-off · {e.number}. {e.title}
              </h2>
              <DropoffChart points={e.dropoff} durationMinutes={e.duration_minutes} />
            </section>
          )}
        </QueryState>
      )}
    </>
  );
}
