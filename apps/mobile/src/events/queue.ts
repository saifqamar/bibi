import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { api } from "@/lib/api";
import { uuid } from "@/lib/uuid";

export type EventType =
  | "play_started"
  | "play_paused"
  | "play_resumed"
  | "play_completed"
  | "drop_off"
  | "next_episode_started"
  | "download_started"
  | "download_completed";

export interface QueuedEvent {
  client_event_id: string;
  type: EventType;
  episode_id: string;
  position_seconds: number;
  client_ts: string;
  session_id: string;
  to_episode_id?: string | null;
  device: Record<string, string>;
}

const KEY = "bibi.events";
const BATCH = 200; // server maximum per request
const SESSION_ID = uuid(); // one listening session per app launch
const DEVICE = { platform: Platform.OS, app: "mobile" };

let cache: QueuedEvent[] | null = null;
let writing: Promise<void> = Promise.resolve();
let flushing: Promise<void> | null = null;

async function load(): Promise<QueuedEvent[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(): Promise<void> {
  // Writes are chained so a slow write never overwrites a newer one.
  writing = writing
    .then(() => AsyncStorage.setItem(KEY, JSON.stringify(cache ?? [])))
    .catch(() => undefined);
  return writing;
}

/** Records an event with the device's own clock; it is sent later, even after a restart. */
export async function track(
  type: EventType,
  episodeId: string,
  positionSeconds: number,
  extra: { to_episode_id?: string | null } = {},
): Promise<void> {
  const events = await load();
  events.push({
    client_event_id: uuid(),
    type,
    episode_id: episodeId,
    position_seconds: Math.max(0, Math.round(positionSeconds * 10) / 10),
    client_ts: new Date().toISOString(),
    session_id: SESSION_ID,
    device: DEVICE,
    ...extra,
  });
  await save();
}

export async function pendingEvents(): Promise<QueuedEvent[]> {
  return [...(await load())];
}

/**
 * Sends queued events in batches. Events the server answered for (accepted, duplicate or
 * rejected as invalid) leave the queue; on a network error everything stays for next time.
 */
export function flushEvents(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    try {
      while (true) {
        const batch = (await load()).slice(0, BATCH);
        if (batch.length === 0) return;
        const { response } = await api.POST("/api/v1/events", {
          body: { events: batch },
        });
        if (!response.ok) return;
        const sent = new Set(batch.map((e) => e.client_event_id));
        cache = (cache ?? []).filter((e) => !sent.has(e.client_event_id));
        await save();
      }
    } catch {
      // Offline: keep the queue.
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** Test helper: forgets the in-memory copy so the next call reads storage again. */
export function resetEventQueueForTests(): void {
  cache = null;
  writing = Promise.resolve();
  flushing = null;
}
