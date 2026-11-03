/**
 * Listener-facing TanStack Query hooks shared by the mobile app and the website.
 * Wrap the app in <ApiProvider client={...}> with a client from @bibi/api-client.
 */
import { unwrap, type ApiClient, type Schemas } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

export type ListenerSeries = Schemas["ListenerSeriesOut"];
export type ListenerShelf = Schemas["ListenerShelfOut"];
export type ListenerEpisode = Schemas["ListenerEpisodeOut"];
export type Progress = Schemas["ProgressOut"];
export type DownloadState = Schemas["DownloadOut"];

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error("useApi must be used inside <ApiProvider>");
  return client;
}

export const listenerKeys = {
  shelves: ["listener", "shelves"] as const,
  series: (id: string) => ["listener", "series", id] as const,
  episodes: (id: string) => ["listener", "series", id, "episodes"] as const,
  episode: (id: string) => ["listener", "episodes", id] as const,
  search: (q: string) => ["listener", "search", q] as const,
  progress: ["listener", "progress"] as const,
  downloads: ["listener", "downloads"] as const,
  me: ["listener", "me"] as const,
};

export function useShelves() {
  const api = useApi();
  return useQuery({
    queryKey: listenerKeys.shelves,
    queryFn: async () => unwrap(await api.GET("/api/v1/shelves", { params: { query: { limit: 30 } } })).items,
  });
}

export function useSeries(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: listenerKeys.series(id),
    queryFn: async () => unwrap(await api.GET("/api/v1/series/{series_id}", { params: { path: { series_id: id } } })),
  });
}

export function useSeriesEpisodes(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: listenerKeys.episodes(id),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/series/{series_id}/episodes", { params: { path: { series_id: id } } })),
  });
}

export function useSearch(q: string) {
  const api = useApi();
  const term = q.trim();
  return useQuery({
    queryKey: listenerKeys.search(term),
    enabled: term.length > 0,
    queryFn: async () => unwrap(await api.GET("/api/v1/search", { params: { query: { q: term, limit: 30 } } })).items,
  });
}

export function useProgress() {
  const api = useApi();
  return useQuery({
    queryKey: listenerKeys.progress,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/progress", { params: { query: { limit: 50 } } })),
  });
}

export function useDownloadsList() {
  const api = useApi();
  return useQuery({
    queryKey: listenerKeys.downloads,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/downloads")),
  });
}

export function useDeleteAccount(onDeleted: () => void) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.DELETE("/api/v1/me")),
    onSuccess: () => {
      queryClient.clear();
      onDeleted();
    },
  });
}

/** The episode to resume: the latest unfinished progress entry for a series, if any. */
export function resumePoint(progress: Progress[] | undefined, seriesId: string): Progress | undefined {
  return progress?.find((p) => p.series_id === seriesId && !p.completed);
}
