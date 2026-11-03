import { Link, Route, Routes, useParams } from "react-router";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { TabNav } from "@/components/TabNav";
import { AudioTab } from "@/writer/audio/AudioTab";
import { AiTab } from "./AiTab";
import { ContinuityTab } from "./ContinuityTab";
import { DraftingPanel } from "./DraftingPanel";
import { EditorTab } from "./EditorTab";
import { HistoryTab } from "./HistoryTab";
import { PlanTab } from "./PlanTab";
import { useEpisode } from "./queries";

export function EpisodePage({ seriesId }: { seriesId: string }) {
  const { episodeId = "" } = useParams();
  const query = useEpisode(episodeId);
  const base = `/writer/series/${seriesId}/episodes/${episodeId}`;
  return (
    <QueryState query={query}>
      {(episode) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/writer/series/${seriesId}/episodes`} className="text-sm text-primary hover:underline">
              ← Episodes
            </Link>
            <h2 className="text-xl font-semibold">
              {episode.number}. {episode.title || `Episode ${episode.number}`}
            </h2>
            <StatusBadge status={episode.status} />
          </div>
          <DraftingPanel episode={episode} />
          <TabNav
            label="Episode sections"
            items={[
              { to: base, label: "Plan", end: true },
              { to: `${base}/editor`, label: "Editor" },
              { to: `${base}/history`, label: "History" },
              { to: `${base}/continuity`, label: "Continuity" },
              { to: `${base}/audio`, label: "Audio" },
              { to: `${base}/ai`, label: "AI & cost" },
            ]}
          />
          <Routes>
            <Route index element={<PlanTab key={episode.updated_at} episode={episode} />} />
            <Route path="editor" element={<EditorTab episode={episode} />} />
            <Route path="history" element={<HistoryTab episode={episode} />} />
            <Route path="continuity" element={<ContinuityTab episode={episode} />} />
            <Route path="audio" element={<AudioTab episode={episode} />} />
            <Route path="ai" element={<AiTab episode={episode} />} />
          </Routes>
        </div>
      )}
    </QueryState>
  );
}
