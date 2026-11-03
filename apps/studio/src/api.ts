import { createApiClient, type Schemas } from "@bibi/api-client";
import { useAuth, type SessionUser } from "@/auth/store";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type TokenPair = Schemas["TokenPair"];

export function toSessionUser(user: TokenPair["user"]): SessionUser {
  return { id: user.id, email: user.email, role: user.role, display_name: user.display_name };
}

export function storeTokenPair(pair: TokenPair) {
  useAuth.getState().setSession({
    user: toSessionUser(pair.user),
    accessToken: pair.access_token,
    refreshToken: pair.refresh_token,
  });
}

let refreshing: Promise<boolean> | null = null;

/** Exchanges the refresh token once, even when several requests get a 401 at the same time. */
export function refreshSession(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (refreshing) return refreshing;
  const refreshToken = useAuth.getState().refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  refreshing = (async () => {
    try {
      const response = await fetchImpl(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        useAuth.getState().clear();
        return false;
      }
      storeTokenPair((await response.json()) as TokenPair);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const api = createApiClient({
  baseUrl: API_URL,
  getAccessToken: () => useAuth.getState().accessToken,
  onUnauthorized: () => refreshSession(),
});
