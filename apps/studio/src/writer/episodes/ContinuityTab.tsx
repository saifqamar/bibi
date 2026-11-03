import { unwrap, type Schemas } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/errors";
import { aiKeys, useEpisodeRuns } from "./AiTab";
import { ACTIVE_STATUSES } from "./drafting";
import { episodeKeys, useDraft, type Episode } from "./queries";

type Issue = Schemas["IssueOut"];

const TYPE_LABELS: Record<string, string> = {
  character_fact: "Character",
  timeline: "Timeline",
  world_rule: "World rule",
  plot_thread: "Plot thread",
  naming: "Naming",
};

const SECTION_FOR_ENTITY: Record<string, string> = {
  characters: "characters",
  relationships: "relationships",
  locations: "locations",
  "world-rules": "world-rules",
  timeline: "timeline",
  "plot-threads": "plot-threads",
};

const issueKey = (episodeId: string) => ["studio", "episodes", episodeId, "continuity"] as const;

/** The paragraph around the quote, with the quote marked. */
function QuoteInContext({ quote, text }: { quote: string; text: string }) {
  const index = text.toLowerCase().indexOf(quote.toLowerCase());
  if (index === -1) return <blockquote className="border-l-2 border-border pl-3 italic">{quote}</blockquote>;
  const start = Math.max(text.lastIndexOf("\n", index) + 1, index - 200);
  const nextBreak = text.indexOf("\n", index + quote.length);
  const end = Math.min(nextBreak === -1 ? text.length : nextBreak, index + quote.length + 200);
  return (
    <blockquote className="border-l-2 border-border pl-3">
      {start > 0 && "…"}
      {text.slice(start, index)}
      <mark className="rounded bg-warning/40 px-0.5">{text.slice(index, index + quote.length)}</mark>
      {text.slice(index + quote.length, end)}
      {end < text.length && "…"}
    </blockquote>
  );
}

function source(issue: Issue): string {
  const ref = issue.source_ref as { kind?: string; entity_type?: string | null; episode_number?: number | null; excerpt?: string | null };
  const where =
    ref.kind === "episode" && ref.episode_number
      ? `Episode ${ref.episode_number}`
      : ref.entity_type
        ? `Story bible · ${ref.entity_type.replace(/-/g, " ")}`
        : "Story bible";
  return ref.excerpt ? `${where}: “${ref.excerpt}”` : where;
}

function IssueCard({ issue, text, seriesId, onChange }: { issue: Issue; text: string; seriesId: string; onChange: () => void }) {
  const [explaining, setExplaining] = useState(false);
  const [note, setNote] = useState("");
  const resolve = useMutation({
    mutationFn: async (body: { status: "fixed" | "intentional"; note: string }) =>
      unwrap(await api.POST("/api/v1/studio/continuity-issues/{issue_id}/resolve", { params: { path: { issue_id: issue.id } }, body })),
    onSuccess: onChange,
  });
  const entity = (issue.source_ref as { entity_type?: string | null }).entity_type;
  const section = entity ? SECTION_FOR_ENTITY[entity] : undefined;

  return (
    <article aria-label={`${issue.severity}: ${issue.description}`} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={issue.severity === "error" ? "destructive" : "warning"}>{issue.severity}</Badge>
        <Badge variant="outline">{TYPE_LABELS[issue.type] ?? issue.type}</Badge>
      </div>
      <p className="font-medium">{issue.description}</p>
      <QuoteInContext quote={issue.quote} text={text} />
      <p className="text-xs text-muted-foreground">Conflicts with: {source(issue)}</p>
      {explaining ? (
        <div className="flex flex-wrap items-end gap-2">
          <Input aria-label="Why is this intentional?" placeholder="Why is this intentional?" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-md" />
          <Button size="sm" disabled={!note.trim() || resolve.isPending} onClick={() => resolve.mutate({ status: "intentional", note })}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExplaining(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate({ status: "fixed", note: "" })}>
            Mark fixed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExplaining(true)}>
            It's intentional
          </Button>
          {section && (
            <Button size="sm" variant="link" asChild>
              <Link to={`/writer/series/${seriesId}/bible/${section}`}>Update the story bible</Link>
            </Button>
          )}
        </div>
      )}
      <FormError message={resolve.isError ? errorMessage(resolve.error) : null} />
    </article>
  );
}

export function ContinuityTab({ episode }: { episode: Episode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: issueKey(episode.id),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/continuity-issues", { params: { path: { episode_id: episode.id } } })),
  });
  const draft = useDraft(episode.id, episode.current_version);
  const runs = useEpisodeRuns(episode.id);
  const checking = runs.data?.find((r) => r.workflow === "continuity" && ACTIVE_STATUSES.has(r.status));
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: issueKey(episode.id) });
    void queryClient.invalidateQueries({ queryKey: aiKeys.runs(episode.id) });
    void queryClient.invalidateQueries({ queryKey: episodeKeys.one(episode.id) });
  };
  const start = useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/api/v1/studio/episodes/{episode_id}/workflows/continuity", { params: { path: { episode_id: episode.id } } })),
    onSuccess: refresh,
  });

  // While a check runs, poll until it finishes, then reload the issues.
  const { refetch } = runs;
  const wasChecking = Boolean(checking);
  useEffect(() => {
    if (!wasChecking) return;
    const timer = setInterval(() => void refetch(), 2000);
    return () => {
      clearInterval(timer);
      void queryClient.invalidateQueries({ queryKey: issueKey(episode.id) });
    };
  }, [wasChecking, refetch, queryClient, episode.id]);

  const text = draft.data?.text ?? "";
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Compares this episode with the story bible and earlier episodes. Errors must be resolved before audio; warnings never block.
        </p>
        <Button onClick={() => start.mutate()} disabled={start.isPending || Boolean(checking) || !episode.current_version}>
          {checking ? "Checking…" : "Check continuity"}
        </Button>
      </div>
      <FormError message={start.isError ? errorMessage(start.error) : null} />
      <QueryState query={query}>
        {(issues) => {
          const open = issues.filter((i) => i.status === "open");
          const resolved = issues.filter((i) => i.status !== "open");
          const errors = open.filter((i) => i.severity === "error");
          return (
            <>
              <p className="text-sm font-medium" aria-live="polite">
                {open.length === 0 ? "No open issues." : `${errors.length} error(s), ${open.length - errors.length} warning(s) open.`}
              </p>
              {open.map((issue) => (
                <IssueCard key={issue.id} issue={issue} text={text} seriesId={episode.series_id} onChange={refresh} />
              ))}
              {resolved.length > 0 && (
                <section aria-label="Resolved issues">
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Resolved</h2>
                  <ul className="flex flex-col gap-1 text-sm">
                    {resolved.map((issue) => (
                      <li key={issue.id} className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={issue.status === "fixed" ? "resolved" : "accepted"} />
                        <span>{issue.description}</span>
                        {issue.resolution_note && <span className="text-muted-foreground">· {issue.resolution_note}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
