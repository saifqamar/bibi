import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { formatUsd } from "@/lib/format";
import { aiKeys } from "@/writer/episodes/AiTab";

/** Soft budget: a warning only, nothing is blocked. */
export function BudgetWarning({ seriesId }: { seriesId: string }) {
  const query = useQuery({
    queryKey: aiKeys.seriesCosts(seriesId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/series/{series_id}/costs", { params: { path: { series_id: seriesId } } })),
  });
  const data = query.data;
  if (!data?.budget.over_budget || data.budget.soft_limit_usd == null) return null;
  return (
    <div role="status" className="mb-4 rounded-[var(--radius)] border border-warning bg-warning/10 p-3 text-sm">
      AI spend for this series is {formatUsd(data.summary.total_usd)}, over its budget of {formatUsd(data.budget.soft_limit_usd)}.
    </div>
  );
}
