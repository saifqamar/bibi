import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Role = "listener" | "writer" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  display_name?: string | null;
}

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: SessionUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clear: () => void;
}

// localStorage can throw (private mode, blocked storage); fall back to memory.
const safeStorage = createJSONStorage(() => {
  try {
    window.localStorage.setItem("__bibi_probe", "1");
    window.localStorage.removeItem("__bibi_probe");
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
    };
  }
});

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "bibi-studio-auth", storage: safeStorage },
  ),
);

/** Where a signed-in user lands after login. */
export function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "writer") return "/writer";
  return "/not-allowed";
}
