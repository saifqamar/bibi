import { Route, Routes, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { TabNav } from "@/components/TabNav";
import { BibleTab } from "@/writer/bible/BibleTab";
import { ProposalsTab, usePendingProposals } from "@/writer/bible/ProposalsTab";
import { OverviewTab } from "./OverviewTab";
import { useSeries } from "./queries";

export function SeriesWorkspace() {
  const { seriesId = "" } = useParams();
  const query = useSeries(seriesId);
  const pending = usePendingProposals(seriesId);
  const base = `/writer/series/${seriesId}`;

  return (
    <QueryState query={query}>
      {(series) => (
        <>
          <PageHeader
            title={
              <span className="flex items-center gap-3">
                {series.title} <StatusBadge status={series.status} />
              </span>
            }
            description="AI-assisted story · listeners always see this label."
          />
          <TabNav
            label="Series sections"
            items={[
              { to: base, label: "Overview", end: true },
              { to: `${base}/bible`, label: "Story bible" },
              { to: `${base}/proposals`, label: "Canon proposals", badge: pending.data?.length },
            ]}
          />
          <div className="pt-6">
            <Routes>
              <Route index element={<OverviewTab series={series} />} />
              <Route path="bible/*" element={<BibleTab seriesId={series.id} />} />
              <Route path="proposals" element={<ProposalsTab seriesId={series.id} />} />
            </Routes>
          </div>
        </>
      )}
    </QueryState>
  );
}
