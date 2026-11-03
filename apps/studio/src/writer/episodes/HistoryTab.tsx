import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";
import { formatDuration } from "@/lib/script";
import { cn } from "@/lib/utils";
import { episodeKeys, useDraft, useDrafts, type Episode } from "./queries";

function CompareView({ episodeId, a, b }: { episodeId: string; a: number; b: number }) {
  const query = useQuery({
    queryKey: ["studio", "episodes", episodeId, "compare", a, b],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/studio/episodes/{episode_id}/drafts/compare", {
          params: { path: { episode_id: episodeId }, query: { a, b } },
        }),
      ),
  });
  return (
    <QueryState query={query}>
      {(diff) => (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border font-mono text-xs" aria-label={`Compare v${a} and v${b}`}>
          <div className="bg-muted px-2 py-1 font-sans font-medium">v{a}</div>
          <div className="bg-muted px-2 py-1 font-sans font-medium">v{b}</div>
          {diff.ops.map((op, i) => (
            <div key={i} className="contents">
              <pre className={cn("whitespace-pre-wrap bg-background px-2 py-1", (op.op === "delete" || op.op === "replace") && "bg-destructive/10")}>
                {op.a_lines.join("\n")}
              </pre>
              <pre className={cn("whitespace-pre-wrap bg-background px-2 py-1", (op.op === "insert" || op.op === "replace") && "bg-success/10")}>
                {op.b_lines.join("\n")}
              </pre>
            </div>
          ))}
        </div>
      )}
    </QueryState>
  );
}

export function HistoryTab({ episode }: { episode: Episode }) {
  const queryClient = useQueryClient();
  const drafts = useDrafts(episode.id);
  const [viewing, setViewing] = useState<number | null>(null);
  const [compare, setCompare] = useState<{ a: number; b: number } | null>(null);
  const viewed = useDraft(episode.id, viewing);
  const restore = useMutation({
    mutationFn: async (version: number) =>
      unwrap(
        await api.POST("/api/v1/studio/episodes/{episode_id}/drafts/{version}/restore", {
          params: { path: { episode_id: episode.id, version } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) });
      void queryClient.invalidateQueries({ queryKey: episodeKeys.drafts(episode.id) });
    },
  });

  return (
    <QueryState query={drafts}>
      {(versions) =>
        versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Length</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.version}>
                    <TableCell>
                      v{v.version}
                      {v.version === episode.current_version && <span className="ml-2 text-xs text-muted-foreground">current</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.source === "ai" ? "outline" : "muted"}>{v.source === "ai" ? "AI" : "Writer"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{v.note}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(v.estimated_seconds)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(v.version)}>
                        View
                      </Button>
                      {v.version !== episode.current_version && (
                        <Button size="sm" variant="ghost" disabled={restore.isPending} onClick={() => restore.mutate(v.version)}>
                          Restore
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <FormError message={restore.isError ? errorMessage(restore.error) : null} />

            {versions.length > 1 && (
              <CompareControls versions={versions.map((v) => v.version)} onCompare={(a, b) => setCompare({ a, b })} />
            )}
            {compare && <CompareView episodeId={episode.id} a={compare.a} b={compare.b} />}

            {viewing && viewed.data && (
              <section aria-label={`Version ${viewing}`}>
                <h2 className="mb-2 text-sm font-semibold">Version {viewing}</h2>
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius)] border border-border p-3 text-sm">{viewed.data.text}</pre>
              </section>
            )}
          </div>
        )
      }
    </QueryState>
  );
}

function CompareControls({ versions, onCompare }: { versions: number[]; onCompare: (a: number, b: number) => void }) {
  const [a, setA] = useState(versions[1]);
  const [b, setB] = useState(versions[0]);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Compare
        <Select aria-label="Older version" value={a} onChange={(e) => setA(Number(e.target.value))}>
          {versions.map((v) => (
            <option key={v} value={v}>
              v{v}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        with
        <Select aria-label="Newer version" value={b} onChange={(e) => setB(Number(e.target.value))}>
          {versions.map((v) => (
            <option key={v} value={v}>
              v{v}
            </option>
          ))}
        </Select>
      </label>
      <Button variant="outline" onClick={() => onCompare(a, b)} disabled={a === b}>
        Compare
      </Button>
    </div>
  );
}
