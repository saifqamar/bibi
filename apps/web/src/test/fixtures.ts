import { vi } from "vitest";

export const SERIES_ID = "5b0f3a4e-8d2c-4c35-9a3b-2f7f1f0c9e11";

export const series = (overrides: object = {}) => ({
  id: SERIES_ID,
  title: "Harbour Lights",
  premise: "A lighthouse keeper hears a bell no one rings.",
  language: "en",
  tone: "quiet",
  themes: ["family", "sea"],
  is_ai_assisted: true as const,
  free_episode_count: 1,
  play_count: 1520,
  cover_url: "https://media.example/covers/harbour.jpg?sig=x",
  published_at: "2026-10-01T00:00:00Z",
  ...overrides,
});

export const detail = (overrides: object = {}) => ({
  series: series(),
  episodes: [
    {
      id: "e1",
      series_id: SERIES_ID,
      number: 1,
      title: "Fog",
      duration_seconds: "912.0",
      is_free: true,
      published_at: null,
    },
    {
      id: "e2",
      series_id: SERIES_ID,
      number: 2,
      title: "Bells",
      duration_seconds: "1003.0",
      is_free: false,
      published_at: null,
    },
  ],
  has_sample: true,
  ...overrides,
});

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Routes fetch by URL path; returns the list of requested URLs. */
export function mockFetch(routes: Record<string, () => Response>) {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      urls.push(url);
      const path = new URL(url, "http://localhost").pathname;
      const route = routes[path];
      return route
        ? route()
        : json(
            {
              error: {
                code: "not_found",
                message: "Not found",
                details: {},
                request_id: null,
              },
            },
            404,
          );
    }),
  );
  return urls;
}
