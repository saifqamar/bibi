import { unwrap, type Schemas } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { seriesKeys } from "@/writer/series/queries";

type Proposal = Schemas["ProposalOut"];

function useProposals(seriesId: string) {
  return useQuery({
    queryKey: seriesKeys.proposals(seriesId),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/studio/series/{series_id}/canon-proposals", { params: { path: { series_id: seriesId } } }),
      ),
  });
}

export function usePendingProposals(seriesId: string) {
  const query = useProposals(seriesId);
  return { ...query, data: query.data?.filter((p) => p.status === "pending") };
}

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

const HIDDEN = new Set(["id", "series_id", "created_at", "updated_at"]);

function ProposalDiff({ proposal }: { proposal: Proposal }) {
  const current = proposal.current ?? {};
  const fields =
    proposal.op === "delete"
      ? Object.keys(current).filter((k) => !HIDDEN.has(k))
      : Object.keys(proposal.payload).filter((k) => !HIDDEN.has(k));
  if (fields.length === 0) return null;
  return (
    <table className="mt-3 w-full text-sm">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="w-1/4 py-1 font-medium">Field</th>
          {proposal.op !== "create" && <th className="py-1 font-medium">Now</th>}
          {proposal.op !== "delete" && <th className="py-1 font-medium">Proposed</th>}
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field} className="border-t border-border align-top">
            <td className="py-1 pr-2 text-muted-foreground">{field.replace(/_/g, " ")}</td>
            {proposal.op !== "create" && <td className="py-1 pr-2">{show(current[field])}</td>}
            {proposal.op !== "delete" && <td className="py-1 font-medium">{show(proposal.payload[field])}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProposalsTab({ seriesId }: { seriesId: string }) {
  const queryClient = useQueryClient();
  const query = useProposals(seriesId);
  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      action === "accept"
        ? unwrap(await api.POST("/api/v1/studio/canon-proposals/{proposal_id}/accept", { params: { path: { proposal_id: id } } }))
        : unwrap(await api.POST("/api/v1/studio/canon-proposals/{proposal_id}/reject", { params: { path: { proposal_id: id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seriesKeys.proposals(seriesId) });
      void queryClient.invalidateQueries({ queryKey: seriesKeys.bible(seriesId) });
    },
  });

  return (
    <QueryState query={query}>
      {(proposals) => {
        const pending = proposals.filter((p) => p.status === "pending");
        const decided = proposals.filter((p) => p.status !== "pending").reverse();
        return (
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              After drafting, the AI suggests canon updates from the approved text. Nothing changes until you accept it.
            </p>
            <FormError message={decide.isError ? errorMessage(decide.error) : null} />
            {pending.length === 0 && <p className="text-sm">No pending proposals.</p>}
            {pending.map((proposal) => (
              <article key={proposal.id} className="rounded-[var(--radius)] border border-border p-4" aria-label={`Proposal ${proposal.op} ${proposal.entity_type}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{proposal.op}</Badge>
                  <span className="font-medium">{proposal.entity_type.replace(/-/g, " ")}</span>
                </div>
                {proposal.reason && <p className="mt-2 text-sm text-muted-foreground">{proposal.reason}</p>}
                <ProposalDiff proposal={proposal} />
                <div className="mt-4 flex gap-2">
                  <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: proposal.id, action: "accept" })}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: proposal.id, action: "reject" })}>
                    Reject
                  </Button>
                </div>
              </article>
            ))}
            {decided.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Decided</h2>
                <ul className="flex flex-col gap-1 text-sm">
                  {decided.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <StatusBadge status={p.status} /> {p.op} {p.entity_type.replace(/-/g, " ")}
                      {p.reason && <span className="truncate text-muted-foreground">· {p.reason}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        );
      }}
    </QueryState>
  );
}
