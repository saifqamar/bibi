import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { formatUsd } from "@/lib/format";
import { formatDuration } from "@/lib/script";

type Decision = "approve" | "request-changes" | "reject";

export function ReviewDetailPage() {
  const { itemId = "" } = useParams();
  const queryClient = useQueryClient();
  const key = ["admin", "review-items", itemId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/review-items/{item_id}", { params: { path: { item_id: itemId } } })),
  });
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comments, setComments] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["admin", "review-queue"] });
  };

  const decide = useMutation({
    mutationFn: async () => {
      const path = { params: { path: { item_id: itemId } } };
      if (decision === "approve")
        return unwrap(await api.POST("/api/v1/admin/review-items/{item_id}/approve", { ...path, body: { publish_now: publishNow, comments } }));
      if (decision === "request-changes")
        return unwrap(await api.POST("/api/v1/admin/review-items/{item_id}/request-changes", { ...path, body: { comments } }));
      return unwrap(await api.POST("/api/v1/admin/review-items/{item_id}/reject", { ...path, body: { comments } }));
    },
    onSuccess: () => {
      setDecision(null);
      setComments("");
      refresh();
    },
  });
  const publishing = useMutation({
    mutationFn: async ({ episodeId, action }: { episodeId: string; action: "publish" | "unpublish" }) =>
      action === "publish"
        ? unwrap(await api.POST("/api/v1/admin/episodes/{episode_id}/publish", { params: { path: { episode_id: episodeId } } }))
        : unwrap(await api.POST("/api/v1/admin/episodes/{episode_id}/unpublish", { params: { path: { episode_id: episodeId } } })),
    onSuccess: refresh,
  });

  return (
    <QueryState query={query}>
      {(detail) => {
        const { item } = detail;
        const pending = item.status === "pending";
        const needsComments = decision === "request-changes" || decision === "reject";
        return (
          <>
            <Link to="/admin" className="text-sm text-primary hover:underline">
              ← Review queue
            </Link>
            <PageHeader
              title={`${item.series_title} · ${item.episode_number}. ${item.episode_title || "Untitled"}`}
              description={`Version ${item.draft_version}`}
              actions={<StatusBadge status={item.status} />}
            />
            <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
              <div className="flex flex-col gap-4">
                {detail.audio ? (
                  <Card>
                    <CardContent className="flex flex-col gap-2 pt-5">
                      <audio controls preload="none" src={detail.audio.url} className="w-full" aria-label="Episode audio" />
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(Number(detail.audio.duration_seconds))} · {Number(detail.audio.loudness_lufs).toFixed(1)} LUFS
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-destructive">The reviewed audio is no longer the episode's current audio.</p>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Script</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap text-sm leading-6">{detail.text}</pre>
                  </CardContent>
                </Card>
              </div>
              <aside className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {pending ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={decision === "approve" ? "default" : "outline"} onClick={() => setDecision("approve")}>
                            Approve
                          </Button>
                          <Button size="sm" variant={decision === "request-changes" ? "default" : "outline"} onClick={() => setDecision("request-changes")}>
                            Request changes
                          </Button>
                          <Button size="sm" variant={decision === "reject" ? "destructive" : "outline"} onClick={() => setDecision("reject")}>
                            Reject
                          </Button>
                        </div>
                        {decision && (
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="review-comments">{needsComments ? "Comments for the writer (required)" : "Comments (optional)"}</Label>
                            <Textarea id="review-comments" value={comments} onChange={(e) => setComments(e.target.value)} />
                            {decision === "approve" && (
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                                Publish now
                              </label>
                            )}
                            <Button disabled={decide.isPending || (needsComments && !comments.trim())} onClick={() => decide.mutate()}>
                              Confirm
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{item.comments || "Decided."}</p>
                    )}
                    {detail.episode_status === "approved" && !detail.is_live && (
                      <Button onClick={() => publishing.mutate({ episodeId: item.episode_id, action: "publish" })} disabled={publishing.isPending}>
                        Publish
                      </Button>
                    )}
                    {detail.is_live && (
                      <>
                        <Badge variant="success">Live for listeners</Badge>
                        <Button variant="outline" onClick={() => publishing.mutate({ episodeId: item.episode_id, action: "unpublish" })} disabled={publishing.isPending}>
                          Unpublish
                        </Button>
                      </>
                    )}
                    <FormError message={decide.error ? errorMessage(decide.error) : publishing.error ? errorMessage(publishing.error) : null} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Continuity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detail.continuity.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No issues were found.</p>
                    ) : (
                      <ul className="flex flex-col gap-2 text-sm">
                        {detail.continuity.map((issue, i) => (
                          <li key={i}>
                            <Badge variant={issue.severity === "error" ? "destructive" : "warning"}>{String(issue.severity)}</Badge>{" "}
                            {String(issue.description)} <span className="text-muted-foreground">({String(issue.status)})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>AI cost {formatUsd(detail.cost.total_usd)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {detail.versions.length} version(s) · {detail.versions.filter((v) => v.source === "ai").length} by AI
                    <p>
                      <Link className="text-primary underline" to={`/writer/series/${item.series_id}/bible`}>
                        Open the story bible
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        );
      }}
    </QueryState>
  );
}
