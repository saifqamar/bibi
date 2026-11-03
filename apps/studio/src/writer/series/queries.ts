import { unwrap, type Schemas } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export type Series = Schemas["SeriesOut"];

export const seriesKeys = {
  all: ["studio", "series"] as const,
  one: (id: string) => ["studio", "series", id] as const,
  bible: (id: string) => ["studio", "series", id, "bible"] as const,
  proposals: (id: string) => ["studio", "series", id, "proposals"] as const,
};

export function useSeriesList() {
  return useQuery({
    queryKey: seriesKeys.all,
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/series", { params: { query: { limit: 100 } } })),
  });
}

export function useSeries(id: string) {
  return useQuery({
    queryKey: seriesKeys.one(id),
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/series/{series_id}", { params: { path: { series_id: id } } })),
  });
}
