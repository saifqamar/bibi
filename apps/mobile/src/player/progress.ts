import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

export interface LocalProgress {
  position: number;
  completed: boolean;
  clientTs: string;
  synced: boolean;
}

const KEY = "bibi.progress";
let cache: Record<string, LocalProgress> | null = null;
let syncing: Promise<void> | null = null;

let loading: Promise<Record<string, LocalProgress>> | null = null;

/** Reads saved progress once; concurrent callers share the same read. */
function load(): Promise<Record<string, LocalProgress>> {
  if (cache) return Promise.resolve(cache);
  loading ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      cache = raw ? (JSON.parse(raw) as Record<string, LocalProgress>) : {};
    } catch {
      cache = {};
    } finally {
      loading = null;
    }
    return cache;
  })();
  return loading;
}

async function save(): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(cache ?? {})).catch(
    () => undefined,
  );
}

export async function localProgress(
  episodeId: string,
): Promise<LocalProgress | undefined> {
  return (await load())[episodeId];
}

/** Saves the position on the device right away; the server copy follows on the next sync. */
export async function saveProgress(
  episodeId: string,
  position: number,
  completed: boolean,
): Promise<void> {
  const all = await load();
  all[episodeId] = {
    position,
    completed,
    clientTs: new Date().toISOString(),
    synced: false,
  };
  await save();
}

/**
 * Where to start an episode: the newer of the local and server positions (by client time).
 * A finished episode starts from the beginning.
 */
export async function resumePosition(
  episodeId: string,
  server?: { position: number; updatedAt: string; completed?: boolean } | null,
): Promise<number> {
  const local = await localProgress(episodeId);
  const serverTs = server ? Date.parse(server.updatedAt) : -Infinity;
  const localTs = local ? Date.parse(local.clientTs) : -Infinity;
  if (!local && !server) return 0;
  const useLocal = localTs >= serverTs;
  const completed = useLocal ? local!.completed : Boolean(server!.completed);
  if (completed) return 0;
  return useLocal ? local!.position : server!.position;
}

/** Pushes unsynced positions with their original client time; the server keeps the latest. */
export function syncProgress(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const all = await load();
      for (const [episodeId, entry] of Object.entries(all)) {
        if (entry.synced) continue;
        const { response } = await api.PUT("/api/v1/me/progress/{episode_id}", {
          params: { path: { episode_id: episodeId } },
          body: {
            position_seconds: entry.position,
            completed: entry.completed,
            client_ts: entry.clientTs,
          },
        });
        // 404: the episode is gone; nothing to sync.
        if (response.ok || response.status === 404) {
          if (all[episodeId]?.clientTs === entry.clientTs)
            all[episodeId] = { ...entry, synced: true };
        } else if (response.status >= 500 || response.status === 401) {
          break;
        }
      }
      await save();
    } catch {
      // Offline: try again on reconnect.
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

export function resetProgressForTests(): void {
  cache = null;
  loading = null;
  syncing = null;
}
