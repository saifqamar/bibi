import { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_URL } from "@/api";
import { useAuth } from "@/auth/store";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { readEventStream } from "@/lib/sse";
import { useEpisodeRuns } from "./AiTab";
import { activeRun, STEP_LABELS, useRefreshEpisode, useWorkflowActions, type Run } from "./drafting";
import type { Episode } from "./queries";

const DRAFTABLE = new Set(["planned", "drafting", "changes_requested"]);

/** Follows a running workflow over server-sent events and refreshes when it pauses or ends. */
function useRunProgress(run: Run | undefined, episode: Episode) {
  const [progress, setProgress] = useState<{ runId: string | null; steps: string[] }>({ runId: null, steps: [] });
  const refresh = useRefreshEpisode(episode);
  const token = useAuth((s) => s.accessToken);
  const runId = run && (run.status === "queued" || run.status === "running") ? run.id : null;

  useEffect(() => {
    if (!runId) return;
    const controller = new AbortController();
    readEventStream(
      `${API_URL}/api/v1/studio/workflow-runs/${runId}/events`,
      token ? { Authorization: `Bearer ${token}` } : {},
      (event) => {
        if (event.event === "end") return refresh();
        try {
          const data = JSON.parse(event.data) as { kind: string; step: string };
          if (data.kind === "step")
            setProgress((current) => ({
              runId,
              steps: current.runId === runId ? [...current.steps, data.step] : [data.step],
            }));
        } catch {
          /* ignore malformed events */
        }
      },
      controller.signal,
    ).catch(() => {
      /* the runs query keeps polling as a fallback */
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, token]);
  return progress.runId === runId ? progress.steps : [];
}

export function DraftingPanel({ episode }: { episode: Episode }) {
  const runs = useEpisodeRuns(episode.id);
  const active = activeRun(runs.data);
  const latest = runs.data?.[0];
  const { start, resume, cancel } = useWorkflowActions(episode);
  const steps = useRunProgress(active, episode);
  const error = start.error ?? resume.error ?? cancel.error;
  const base = `/writer/series/${episode.series_id}`;

  // Poll while something is in flight, in case the event stream drops.
  const { refetch } = runs;
  useEffect(() => {
    if (!active || active.status === "waiting") return;
    const timer = setInterval(() => void refetch(), 3000);
    return () => clearInterval(timer);
  }, [active, refetch]);

  if (runs.isPending) return null;

  const interrupt = active?.status === "waiting" ? (active.interrupt_payload as { kind?: string; proposal_ids?: string[]; draft_version?: number }) : null;

  return (
    <section aria-label="AI drafting" className="rounded-[var(--radius)] border border-border p-4">
      {!active && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium">Draft with AI</p>
            <p className="text-muted-foreground">
              The AI drafts this episode from your beats and the story bible. You review every step.
            </p>
          </div>
          <div className="flex gap-2">
            {latest?.status === "failed" && (
              <Button variant="outline" disabled={resume.isPending} onClick={() => resume.mutate({ runId: latest.id, payload: null })}>
                Retry last run
              </Button>
            )}
            <Button
              disabled={start.isPending || !DRAFTABLE.has(episode.status) || episode.plan.beats.length === 0}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Starting…" : "Draft with AI"}
            </Button>
          </div>
          {episode.plan.beats.length === 0 && <p className="w-full text-xs text-muted-foreground">Add beats in the Plan tab first.</p>}
          {latest?.status === "failed" && (
            <p role="alert" className="w-full text-sm text-destructive">
              The last run failed: {latest.error}
            </p>
          )}
        </div>
      )}

      {active && !interrupt && (
        <div className="flex flex-col gap-2 text-sm" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">
              {active.status === "queued" ? "Waiting for a worker…" : STEP_LABELS[active.current_step] ?? "Working…"}
            </p>
            <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(active.id)}>
              Cancel
            </Button>
          </div>
          {steps.length > 0 && (
            <ol className="list-inside list-decimal text-muted-foreground">
              {steps.map((step, i) => (
                <li key={`${step}-${i}`}>{STEP_LABELS[step] ?? step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {active && interrupt?.kind === "draft_review" && (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">Draft v{interrupt.draft_version} is ready for your review</p>
          <p className="text-muted-foreground">
            Read it in the{" "}
            <Link className="text-primary underline" to={`${base}/episodes/${episode.id}/editor`}>
              Editor
            </Link>
            . Select a passage there to ask for a rewrite, or approve to run the continuity check.
          </p>
          <div className="flex gap-2">
            <Button disabled={resume.isPending} onClick={() => resume.mutate({ runId: active.id, payload: { action: "approve" } })}>
              Approve draft
            </Button>
            <Button variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(active.id)}>
              Cancel run
            </Button>
          </div>
        </div>
      )}

      {active && interrupt?.kind === "contradictions" && (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">The continuity check found contradictions</p>
          <p className="text-muted-foreground">Fix the text or update the canon, then continue. The check runs again.</p>
          <div>
            <Button disabled={resume.isPending} onClick={() => resume.mutate({ runId: active.id, payload: { action: "resolved" } })}>
              I have resolved them
            </Button>
          </div>
        </div>
      )}

      {active && interrupt?.kind === "canon_confirmation" && (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">The AI suggests {interrupt.proposal_ids?.length ?? 0} canon update(s)</p>
          <p className="text-muted-foreground">
            Accept or reject each one in{" "}
            <Link className="text-primary underline" to={`${base}/proposals`}>
              Canon proposals
            </Link>
            , then finish. Nothing changes in the bible unless you accept it.
          </p>
          <div>
            <Button disabled={resume.isPending} onClick={() => resume.mutate({ runId: active.id, payload: { action: "done" } })}>
              Done, finish the episode
            </Button>
          </div>
        </div>
      )}
      <FormError message={error ? errorMessage(error) : null} />
    </section>
  );
}
