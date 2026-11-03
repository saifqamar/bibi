import { unwrap, type Schemas } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { aiKeys } from "./AiTab";
import { episodeKeys } from "./queries";

export type Run = Schemas["RunOut"];
export type Section = Schemas["Section"];

export const ACTIVE_STATUSES = new Set(["queued", "running", "waiting"]);

export const STEP_LABELS: Record<string, string> = {
  load_context: "Gathering the bible and earlier episodes",
  draft: "Drafting the episode",
  writer_review: "Waiting for your review",
  apply_section_rewrites: "Rewriting the selected passages",
  continuity: "Checking continuity",
  resolve_contradictions: "Waiting for you to resolve contradictions",
  propose_canon: "Suggesting canon updates",
  confirm_canon: "Waiting for you to confirm canon updates",
  finalize: "Summarizing and finishing",
};

export function activeRun(runs: Run[] | undefined): Run | undefined {
  return runs?.find((run) => ACTIVE_STATUSES.has(run.status));
}

/** Refreshes everything a workflow can change for an episode. */
export function useRefreshEpisode(episode: { id: string; series_id: string }) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      aiKeys.runs(episode.id),
      aiKeys.costs(episode.id),
      episodeKeys.one(episode.id),
      episodeKeys.drafts(episode.id),
      episodeKeys.list(episode.series_id),
      ["studio", "series", episode.series_id, "proposals"],
      ["studio", "series", episode.series_id, "bible"],
    ]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useWorkflowActions(episode: { id: string; series_id: string }) {
  const refresh = useRefreshEpisode(episode);
  const start = useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/api/v1/studio/episodes/{episode_id}/workflows/drafting", { params: { path: { episode_id: episode.id } } })),
    onSuccess: refresh,
  });
  const resume = useMutation({
    mutationFn: async ({ runId, payload }: { runId: string; payload: Record<string, unknown> | null }) =>
      unwrap(await api.POST("/api/v1/studio/workflow-runs/{run_id}/resume", { params: { path: { run_id: runId } }, body: { payload } })),
    onSuccess: refresh,
  });
  const cancel = useMutation({
    mutationFn: async (runId: string) =>
      unwrap(await api.POST("/api/v1/studio/workflow-runs/{run_id}/cancel", { params: { path: { run_id: runId } } })),
    onSuccess: refresh,
  });
  const regenerate = useMutation({
    mutationFn: async (sections: Section[]) =>
      unwrap(
        await api.POST("/api/v1/studio/episodes/{episode_id}/regenerate-section", {
          params: { path: { episode_id: episode.id } },
          body: { sections },
        }),
      ),
    onSuccess: refresh,
  });
  return { start, resume, cancel, regenerate };
}
