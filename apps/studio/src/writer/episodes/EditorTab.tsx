import { ApiRequestError, unwrap } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { estimatedSeconds, formatDuration, parseScript, wordCount } from "@/lib/script";
import { cn } from "@/lib/utils";
import { episodeKeys, useCharacterNames, useDraft, type Episode } from "./queries";

export function EditorTab({ episode }: { episode: Episode }) {
  const current = useDraft(episode.id, episode.current_version);
  if (episode.current_version && current.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <Editor key={`${episode.id}-${episode.current_version ?? 0}`} episode={episode} initialText={current.data?.text ?? ""} />;
}

function Editor({ episode, initialText }: { episode: Episode; initialText: string }) {
  const queryClient = useQueryClient();
  const names = useCharacterNames(episode.series_id);
  const [text, setText] = useState(initialText);
  const [note, setNote] = useState("");
  const dirty = text !== initialText;
  const seconds = estimatedSeconds(text);
  const lines = useMemo(() => parseScript(text, names.data ?? []), [text, names.data]);
  const unknown = [...new Set(lines.map((l) => l.unknownSpeaker).filter(Boolean))] as string[];
  const ratio = episode.target_seconds ? seconds / episode.target_seconds : 0;

  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/studio/episodes/{episode_id}/drafts", {
          params: { path: { episode_id: episode.id } },
          body: { text, base_version: episode.current_version ?? null, note },
        }),
      ),
    onSuccess: () => {
      setNote("");
      void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) });
      void queryClient.invalidateQueries({ queryKey: episodeKeys.drafts(episode.id) });
      void queryClient.invalidateQueries({ queryKey: episodeKeys.list(episode.series_id) });
    },
  });
  const conflict = save.error instanceof ApiRequestError && save.error.code === "version_conflict";
  const locked = episode.status === "in_review";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Version {episode.current_version ?? "—"}
            {dirty && " · unsaved changes"}
          </span>
          <span className={cn("tabular-nums", ratio > 1.15 || (ratio > 0 && ratio < 0.85) ? "text-warning" : "text-muted-foreground")} aria-live="polite">
            {wordCount(text)} words · ≈ {formatDuration(seconds)} of {formatDuration(episode.target_seconds)}
          </span>
        </div>
        <Textarea
          aria-label="Episode script"
          className="min-h-[28rem] font-mono text-sm leading-6"
          value={text}
          disabled={locked}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Narration is plain text.\nAna: Dialogue starts with a character name and a colon.\n[[scene]] marks a scene break."}
        />
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-60 flex-1 flex-col gap-1.5">
            <Label htmlFor="draft-note">Version note (optional)</Label>
            <Input id="draft-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending || locked}>
            {save.isPending ? "Saving…" : "Save version"}
          </Button>
        </div>
        {locked && <p className="text-sm text-muted-foreground">This episode is in review and cannot be edited right now.</p>}
        {conflict ? (
          <div role="alert" className="text-sm text-destructive">
            A newer version was saved since you started.{" "}
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) })}
            >
              Load the latest version
            </Button>{" "}
            (copy your changes first).
          </div>
        ) : (
          <FormError message={save.isError ? errorMessage(save.error) : null} />
        )}
      </div>
      <aside aria-label="Script preview" className="flex max-h-[36rem] flex-col gap-2 overflow-y-auto rounded-[var(--radius)] border border-border p-3 text-sm">
        <p className="font-medium">Who speaks</p>
        {unknown.length > 0 && (
          <p className="text-warning">Not in the bible: {unknown.join(", ")}. These lines will use the narrator voice.</p>
        )}
        {lines.length === 0 && <p className="text-muted-foreground">Nothing written yet.</p>}
        {lines.map((line, index) =>
          line.kind === "scene_break" ? (
            <hr key={index} className="border-border" />
          ) : (
            <p key={index} className="leading-5">
              <span className={cn("mr-1 font-semibold", line.speaker ? "text-primary" : "text-muted-foreground")}>
                {line.speaker ?? (line.unknownSpeaker ? `${line.unknownSpeaker}?` : "Narrator")}:
              </span>
              {line.text}
            </p>
          ),
        )}
      </aside>
    </div>
  );
}
