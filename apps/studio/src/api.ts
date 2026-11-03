import { createApiClient } from "@bibi/api-client";
import { useAuth } from "@/auth/store";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = createApiClient({
  baseUrl: API_URL,
  getAccessToken: () => useAuth.getState().accessToken,
});
