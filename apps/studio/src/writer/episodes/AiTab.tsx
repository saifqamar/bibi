import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatNumber, formatUsd } from "@/lib/format";
import type { Episode } from "./queries";

export const aiKeys = {
  runs: (episodeId: string) => ["studio", "episodes", episodeId, "runs"] as const,
  costs: (episodeId: string) => ["studio", "episodes", episodeId, "costs"] as const,
  seriesCosts: (seriesId: string) => ["studio", "series", seriesId, "costs"] as const,
};

export function useEpisodeRuns(episodeId: string) {
  return useQuery({
    queryKey: aiKeys.runs(episodeId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/workflow-runs", { params: { path: { episode_id: episodeId } } })),
  });
}

function CostCard({ episodeId }: { episodeId: string }) {
  const query = useQuery({
    queryKey: aiKeys.costs(episodeId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/costs", { params: { path: { episode_id: episodeId } } })),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI cost for this episode</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState query={query}>
          {(cost) => (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-3xl font-semibold tabular-nums">{formatUsd(cost.total_usd)}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-4">
                <dt>Input tokens</dt>
                <dd className="tabular-nums text-foreground">{formatNumber(cost.input_tokens)}</dd>
                <dt>Output tokens</dt>
                <dd className="tabular-nums text-foreground">{formatNumber(cost.output_tokens)}</dd>
                <dt>Embedding tokens</dt>
                <dd className="tabular-nums text-foreground">{formatNumber(cost.embedding_tokens)}</dd>
                <dt>TTS characters</dt>
                <dd className="tabular-nums text-foreground">{formatNumber(cost.tts_characters)}</dd>
              </dl>
              {cost.by_purpose.length > 0 && (
                <ul aria-label="Cost by purpose" className="flex flex-wrap gap-x-4 gap-y-1">
                  {cost.by_purpose.map((p) => (
                    <li key={p.purpose}>
                      {p.purpose}: <span className="tabular-nums">{formatUsd(p.cost_usd)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}

export function AiTab({ episode }: { episode: Episode }) {
  const runs = useEpisodeRuns(episode.id);
  return (
    <div className="flex flex-col gap-6">
      <CostCard episodeId={episode.id} />
      <section aria-labelledby="runs-heading">
        <h2 id="runs-heading" className="mb-2 font-semibold">
          AI runs
        </h2>
        <QueryState query={runs}>
          {(items) =>
            items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI runs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{run.workflow}</TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                        {run.error && (
                          <p className="mt-1 max-w-xs text-xs text-destructive">
                            {run.error}
                            {run.request_id && <span className="block text-muted-foreground">Request {run.request_id}</span>}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{run.current_step.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(run.cost_usd)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(run.started_at ?? run.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </QueryState>
      </section>
    </div>
  );
}
