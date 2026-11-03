import { unwrap, type Schemas } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";
import { formatDuration } from "@/lib/script";
import { episodeKeys, type Episode } from "@/writer/episodes/queries";

type Line = Schemas["AudioLineOut"];

const FLAGS: Record<string, string> = {
  unknown_speaker: "Not in the bible · narrator voice",
  no_voice_assigned: "No voice assigned · narrator voice",
};

export const audioKey = (episodeId: string) => ["studio", "episodes", episodeId, "audio"] as const;

function LineRow({ line, onStarted, busy }: { line: Line; onStarted: () => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(line.text);
  const regenerate = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/studio/audio-lines/{line_id}/regenerate", { params: { path: { line_id: line.id } } })),
    onSuccess: onStarted,
  });
  const edit = useMutation({
    mutationFn: async () => unwrap(await api.PUT("/api/v1/studio/audio-lines/{line_id}", { params: { path: { line_id: line.id } }, body: { text } })),
    onSuccess: () => {
      setEditing(false);
      onStarted();
    },
  });
  const error = regenerate.error ?? edit.error;
  return (
    <TableRow>
      <TableCell className="tabular-nums text-muted-foreground">{line.position + 1}</TableCell>
      <TableCell className="whitespace-nowrap">{line.speaker ?? "Narrator"}</TableCell>
      <TableCell>
        {editing ? (
          <div className="flex gap-2">
            <Input aria-label={`Text for line ${line.position + 1}`} value={text} onChange={(e) => setText(e.target.value)} />
            <Button size="sm" disabled={!text.trim() || edit.isPending} onClick={() => edit.mutate()}>
              Save & re-record
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <p>{line.text}</p>
            {line.flag && <Badge variant="warning">{FLAGS[line.flag] ?? line.flag}</Badge>}
            {line.error && <p className="text-xs text-destructive">{line.error}</p>}
          </>
        )}
        <FormError message={error ? errorMessage(error) : null} />
      </TableCell>
      <TableCell>
        <StatusBadge status={line.status === "done" ? "resolved" : line.status === "failed" ? "rejected" : "pending"} />
      </TableCell>
      <TableCell className="tabular-nums">{formatDuration(line.duration_ms / 1000)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {line.url && <audio controls preload="none" src={line.url} className="h-8 w-40" aria-label={`Play line ${line.position + 1}`} />}
          {!editing && (
            <>
              <Button size="sm" variant="ghost" disabled={busy || regenerate.isPending} onClick={() => regenerate.mutate()}>
                Regenerate
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(true)}>
                Fix text
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AudioTab({ episode }: { episode: Episode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: audioKey(episode.id),
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/audio", { params: { path: { episode_id: episode.id } } })),
    refetchInterval: (q) => (q.state.data?.render && ["queued", "running"].includes(q.state.data.render.status) ? 2000 : false),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: audioKey(episode.id) });
    void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) });
    void queryClient.invalidateQueries({ queryKey: episodeKeys.drafts(episode.id) });
  };
  const start = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/studio/episodes/{episode_id}/audio", { params: { path: { episode_id: episode.id } } })),
    onSuccess: refresh,
  });
  const retry = useMutation({
    mutationFn: async (renderId: string) => unwrap(await api.POST("/api/v1/studio/audio-renders/{render_id}/retry", { params: { path: { render_id: renderId } } })),
    onSuccess: refresh,
  });
  const ready = episode.status === "ready_for_audio" || episode.status === "audio_ready";

  return (
    <QueryState query={query}>
      {(audio) => {
        const busy = Boolean(audio.render && ["queued", "running"].includes(audio.render.status));
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {ready ? "Lines that have not changed reuse their earlier recording." : "Audio can be produced once the episode is ready for audio."}
              </p>
              <Button disabled={!ready || busy || start.isPending} onClick={() => start.mutate()}>
                {busy ? "Producing…" : audio.asset ? "Re-render audio" : "Generate audio"}
              </Button>
            </div>
            <FormError message={start.error ? errorMessage(start.error) : retry.error ? errorMessage(retry.error) : null} />

            {audio.render && busy && (
              <div aria-live="polite" className="text-sm">
                <p className="font-medium">
                  Recording lines: {audio.render.lines_done} / {audio.render.lines_total}
                </p>
                <progress className="w-full" max={audio.render.lines_total} value={audio.render.lines_done} />
              </div>
            )}
            {audio.render?.status === "failed" && (
              <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
                {audio.render.error}
                <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(audio.render!.id)}>
                  Retry failed lines
                </Button>
              </div>
            )}

            {audio.asset && (
              <section aria-label="Episode audio" className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-4">
                <audio controls preload="none" src={audio.asset.url} className="w-full" aria-label="Episode audio player" />
                <p className="text-sm text-muted-foreground">
                  {formatDuration(Number(audio.asset.duration_seconds))} · {Number(audio.asset.loudness_lufs).toFixed(1)} LUFS · peak{" "}
                  {Number(audio.asset.peak_dbfs).toFixed(1)} dBFS
                </p>
                {!audio.is_current && <Badge variant="warning">The text changed since this audio was made</Badge>}
              </section>
            )}

            {audio.lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Voice</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audio.lines
                    .filter((line) => line.kind !== "scene_break")
                    .map((line) => (
                      <LineRow key={line.id} line={line} busy={busy} onStarted={refresh} />
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
      }}
    </QueryState>
  );
}
