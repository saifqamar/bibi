/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Call {
  method: string;
  url: string;
  body: unknown;
}
export interface Route {
  method?: string;
  path: string;
  respond: () => Response | Promise<Response>;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Replaces global fetch with a router over exact paths; unmatched requests get 404. */
export function mockFetch(routes: Route[]) {
  const calls: Call[] = [];
  globalThis.fetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request =
        input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      const text = request.method === "GET" ? "" : await request.text();
      calls.push({
        method: request.method,
        url: request.url,
        body: text ? JSON.parse(text) : null,
      });
      const route = routes.find(
        (r) =>
          (r.method ?? "GET") === request.method && r.path === url.pathname,
      );
      if (!route)
        return json(
          {
            error: {
              code: "not_found",
              message: `No mock for ${request.method} ${url.pathname}`,
            },
          },
          404,
        );
      return route.respond();
    },
  ) as typeof fetch;
  return { calls };
}

export async function signedIn() {
  const SecureStore = require("expo-secure-store");
  await SecureStore.setItemAsync(
    "bibi.session",
    JSON.stringify({
      user: { id: "u1", email: "lena@example.com", role: "listener" },
      tokens: { accessToken: "a", refreshToken: "r" },
    }),
  );
}

export async function resetState() {
  const SecureStore = require("expo-secure-store");
  SecureStore.__store.clear();
  await AsyncStorage.clear();
  const { useSession } = require("@/lib/session");
  useSession.setState({ ready: false, user: null, tokens: null });
}

export const series = (overrides: object = {}) => ({
  id: "s1",
  title: "Harbour Lights",
  premise: "A lighthouse keeper hears a bell no one rings.",
  language: "en",
  tone: "quiet",
  themes: ["family", "sea"],
  cover_url: null,
  is_ai_assisted: true,
  free_episode_count: 1,
  play_count: 42,
  published_at: "2026-10-01T00:00:00Z",
  episode_count: 2,
  ...overrides,
});

export const episode = (n: number, overrides: object = {}) => ({
  id: `e${n}`,
  series_id: "s1",
  number: n,
  title: n === 1 ? "Fog" : "Bells",
  duration_seconds: "900.0",
  is_free: n === 1,
  published_at: "2026-10-01T00:00:00Z",
  ...overrides,
});

export const progress = (overrides: object = {}) => ({
  episode_id: "e2",
  series_id: "s1",
  series_title: "Harbour Lights",
  episode_number: 2,
  episode_title: "Bells",
  position_seconds: "120.0",
  duration_seconds: "900.0",
  completed: false,
  updated_at: "2026-11-02T10:00:00Z",
  ...overrides,
});
