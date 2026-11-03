import { createApiClient, type Schemas } from "@bibi/api-client";
import { API_URL } from "./config";
import { useSession } from "./session";

type TokenPair = Schemas["TokenPair"];

export async function storeTokenPair(pair: TokenPair): Promise<void> {
  await useSession
    .getState()
    .signIn(
      {
        id: pair.user.id,
        email: pair.user.email,
        role: pair.user.role,
        display_name: pair.user.display_name,
      },
      { accessToken: pair.access_token, refreshToken: pair.refresh_token },
    );
}

let refreshing: Promise<boolean> | null = null;

/** Exchanges the refresh token once, even if several requests get a 401 together. */
export function refreshSession(
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (refreshing) return refreshing;
  const refreshToken = useSession.getState().tokens?.refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  refreshing = (async () => {
    try {
      const response = await fetchImpl(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        await useSession.getState().signOut();
        return false;
      }
      await storeTokenPair((await response.json()) as TokenPair);
      return true;
    } catch {
      return false; // offline: keep the session, try again later
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const api = createApiClient({
  baseUrl: API_URL,
  getAccessToken: () => useSession.getState().tokens?.accessToken,
  onUnauthorized: () => refreshSession(),
});
