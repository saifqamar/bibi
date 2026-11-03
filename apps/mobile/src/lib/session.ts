import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export interface SessionUser {
  id: string;
  email: string;
  role: "listener" | "writer" | "admin";
  display_name?: string | null;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionState {
  ready: boolean;
  user: SessionUser | null;
  tokens: Tokens | null;
  load: () => Promise<void>;
  signIn: (user: SessionUser, tokens: Tokens) => Promise<void>;
  setTokens: (tokens: Tokens) => Promise<void>;
  signOut: () => Promise<void>;
}

const KEY = "bibi.session";

/** The session lives in the device keychain/keystore (expo-secure-store), never in plain storage. */
export const useSession = create<SessionState>()((set, get) => ({
  ready: false,
  user: null,
  tokens: null,
  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      const saved = raw
        ? (JSON.parse(raw) as { user: SessionUser; tokens: Tokens })
        : null;
      set({
        ready: true,
        user: saved?.user ?? null,
        tokens: saved?.tokens ?? null,
      });
    } catch {
      set({ ready: true, user: null, tokens: null });
    }
  },
  signIn: async (user, tokens) => {
    set({ user, tokens });
    await SecureStore.setItemAsync(KEY, JSON.stringify({ user, tokens }));
  },
  setTokens: async (tokens) => {
    const user = get().user;
    set({ tokens });
    if (user)
      await SecureStore.setItemAsync(KEY, JSON.stringify({ user, tokens }));
  },
  signOut: async () => {
    set({ user: null, tokens: null });
    await SecureStore.deleteItemAsync(KEY);
  },
}));
