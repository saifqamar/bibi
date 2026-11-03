import "server-only";
import { createApiClient, type Schemas } from "@bibi/api-client";
import { API_URL, REVALIDATE_SECONDS } from "./config";

export type PublicSeries = Schemas["ListenerSeriesOut"];
export type PublicShelf = Schemas["ListenerShelfOut"];
export type PublicEpisode = Schemas["ListenerEpisodeOut"];
export type PublicSeriesDetail = Schemas["PublicSeriesDetail"];
export type SitemapEntry = Schemas["SitemapEntry"];

/** Server-side API client; responses are cached by Next.js for the revalidation window. */
export const api = createApiClient({
  baseUrl: API_URL,
  fetch: (request) =>
    fetch(request, { next: { revalidate: REVALIDATE_SECONDS } }),
});

/** The published series, or null when it does not exist or is no longer published. */
export async function getSeries(
  id: string,
): Promise<PublicSeriesDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, response } = await api.GET(
    "/api/v1/public/series/{series_id}",
    {
      params: { path: { series_id: id } },
    },
  );
  if (response.status === 404) return null;
  if (!data)
    throw new Error(`Could not load series ${id} (${response.status})`);
  return data;
}

export async function getShelves(): Promise<PublicShelf[]> {
  const { data } = await api.GET("/api/v1/public/shelves", {
    params: { query: { limit: 20 } },
  });
  return data?.items ?? [];
}

export async function getShelf(id: string): Promise<PublicShelf | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, response } = await api.GET(
    "/api/v1/public/shelves/{shelf_id}",
    {
      params: { path: { shelf_id: id } },
    },
  );
  if (response.status === 404) return null;
  if (!data) throw new Error(`Could not load shelf ${id} (${response.status})`);
  return data;
}

export async function getSitemap(): Promise<SitemapEntry[]> {
  const { data } = await api.GET("/api/v1/public/sitemap");
  return data ?? [];
}
