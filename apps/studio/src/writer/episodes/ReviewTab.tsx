import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { episodeKeys, type Episode } from "./queries";

const reviewsKey = (episodeId: string) => ["studio", "episodes", episodeId, "reviews"] as const;

export function ReviewTab({ episode }: { episode: Episode }) {
  const queryClient = useQueryClient();
  const reviews = useQuery({
    queryKey: reviewsKey(episode.id),
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/reviews", { params: { path: { episode_id: episode.id } } })),
  });
  const submit = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/studio/episodes/{episode_id}/submit", { params: { path: { episode_id: episode.id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewsKey(episode.id) });
      void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) });
    },
  });
  const canSubmit = episode.status === "audio_ready";

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {episode.status === "in_review"
            ? "An admin is reviewing this episode."
            : canSubmit
              ? "The audio is ready. Submit the episode for an admin to review and publish."
              : "Submit once the audio is produced and continuity errors are resolved."}
        </p>
        <Button disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
      <FormError message={submit.isError ? errorMessage(submit.error) : null} />
      <QueryState query={reviews}>
        {(items) =>
          items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not submitted yet.</p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Review history">
              {items.map((item) => (
                <li key={item.id} className="rounded-[var(--radius)] border border-border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-muted-foreground">
                      v{item.draft_version} · submitted {formatDateTime(item.submitted_at)}
                      {item.decided_at && ` · decided ${formatDateTime(item.decided_at)}`}
                    </span>
                  </div>
                  {item.comments && <p className="mt-2">{item.comments}</p>}
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </div>
  );
}
