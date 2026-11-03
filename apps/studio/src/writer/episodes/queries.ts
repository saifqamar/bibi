import { unwrap, type Schemas } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export type Episode = Schemas["EpisodeOut"];
export type DraftSummary = Schemas["DraftSummary"];
export type Draft = Schemas["DraftOut"];

export const episodeKeys = {
  list: (seriesId: string) => ["studio", "series", seriesId, "episodes"] as const,
  one: (id: string) => ["studio", "episodes", id] as const,
  drafts: (id: string) => ["studio", "episodes", id, "drafts"] as const,
  draft: (id: string, version: number) => ["studio", "episodes", id, "drafts", version] as const,
};

export function useEpisodes(seriesId: string) {
  return useQuery({
    queryKey: episodeKeys.list(seriesId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/series/{series_id}/episodes", { params: { path: { series_id: seriesId } } })),
  });
}

export function useEpisode(id: string) {
  return useQuery({
    queryKey: episodeKeys.one(id),
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}", { params: { path: { episode_id: id } } })),
  });
}

export function useDrafts(id: string) {
  return useQuery({
    queryKey: episodeKeys.drafts(id),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/episodes/{episode_id}/drafts", { params: { path: { episode_id: id } } })),
  });
}

export function useDraft(id: string, version: number | null | undefined) {
  return useQuery({
    queryKey: episodeKeys.draft(id, version ?? 0),
    enabled: Boolean(version),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/studio/episodes/{episode_id}/drafts/{version}", {
          params: { path: { episode_id: id, version: version! } },
        }),
      ),
  });
}

export function useCharacterNames(seriesId: string) {
  return useQuery({
    queryKey: ["studio", "series", seriesId, "character-names"],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/studio/series/{series_id}/characters", { params: { path: { series_id: seriesId } } }),
      ).map((c) => c.name),
  });
}
