import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import { track } from "@/events/queue";
import { api } from "@/lib/api";

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "done"
  | "failed";

/** Everything needed to play an episode with no network. */
export interface EpisodeMeta {
  episodeId: string;
  seriesId: string;
  seriesTitle: string;
  coverUrl?: string | null;
  title: string;
  number: number;
  duration: number;
  previousEpisodeId: string | null;
  nextEpisodeId: string | null;
}

export interface DownloadItem {
  meta: EpisodeMeta;
  status: DownloadStatus;
  progress: number;
  bytes: number;
  uri: string;
  resumeData?: string;
  error?: string;
}

interface DownloadsState {
  ready: boolean;
  items: Record<string, DownloadItem>;
  load: () => Promise<void>;
  download: (
    meta: Omit<EpisodeMeta, "duration" | "nextEpisodeId">,
  ) => Promise<void>;
  pause: (episodeId: string) => Promise<void>;
  resume: (episodeId: string) => Promise<void>;
  remove: (episodeId: string) => Promise<void>;
  removeAll: () => Promise<void>;
  /** Deletes every file on this device without telling the server (sign-out, account deletion). */
  clearLocal: () => Promise<void>;
  sync: () => Promise<void>;
}

const KEY = "bibi.downloads";
const DIR = `${FileSystem.documentDirectory ?? ""}episodes/`;
const tasks = new Map<string, FileSystem.DownloadResumable>();

const fileFor = (episodeId: string) => `${DIR}${episodeId}.mp3`;

async function persist(items: Record<string, DownloadItem>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
}

/** The local file for an episode, if it is fully downloaded. */
export function localFile(episodeId: string): DownloadItem | undefined {
  const item = useDownloads.getState().items[episodeId];
  return item?.status === "done" ? item : undefined;
}

export const useDownloads = create<DownloadsState>()((set, get) => {
  const update = (episodeId: string, patch: Partial<DownloadItem>) => {
    const current = get().items[episodeId];
    if (!current) return;
    const items = { ...get().items, [episodeId]: { ...current, ...patch } };
    set({ items });
    // Progress ticks are frequent; persist only state changes.
    if (patch.status || patch.bytes || patch.resumeData !== undefined)
      void persist(items);
  };

  const run = async (
    episodeId: string,
    task: FileSystem.DownloadResumable,
    resuming: boolean,
  ) => {
    tasks.set(episodeId, task);
    update(episodeId, { status: "downloading", error: undefined });
    try {
      const result = resuming
        ? await task.resumeAsync()
        : await task.downloadAsync();
      if (!result) return; // paused
      if (result.status < 200 || result.status >= 300)
        throw new Error(`HTTP ${result.status}`);
      const info = await FileSystem.getInfoAsync(result.uri);
      update(episodeId, {
        status: "done",
        progress: 1,
        bytes: info.exists ? info.size : 0,
        uri: result.uri,
        resumeData: undefined,
      });
      void track("download_completed", episodeId, 0);
      await api
        .POST("/api/v1/me/downloads", { body: { episode_id: episodeId } })
        .catch(() => undefined);
    } catch (error) {
      if (get().items[episodeId]?.status === "paused") return;
      update(episodeId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      tasks.delete(episodeId);
    }
  };

  const start = (item: DownloadItem, url: string, resumeData?: string) => {
    const task = FileSystem.createDownloadResumable(
      url,
      item.uri,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0) {
          update(item.meta.episodeId, {
            progress: totalBytesWritten / totalBytesExpectedToWrite,
          });
        }
      },
      resumeData,
    );
    return run(item.meta.episodeId, task, Boolean(resumeData));
  };

  const playbackUrl = async (episodeId: string) => {
    const { data, error } = await api.GET(
      "/api/v1/episodes/{episode_id}/playback",
      {
        params: { path: { episode_id: episodeId } },
      },
    );
    if (error || !data)
      throw new Error("This episode is not available to download.");
    return data;
  };

  return {
    ready: false,
    items: {},
    load: async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const items = raw
          ? (JSON.parse(raw) as Record<string, DownloadItem>)
          : {};
        // A download interrupted by closing the app is resumable from where it stopped.
        for (const item of Object.values(items)) {
          if (item.status === "downloading" || item.status === "queued")
            item.status = "paused";
        }
        set({ ready: true, items });
      } catch {
        set({ ready: true, items: {} });
      }
    },
    download: async (meta) => {
      const existing = get().items[meta.episodeId];
      if (existing && existing.status !== "failed") return;
      const item: DownloadItem = {
        meta: { ...meta, duration: 0, nextEpisodeId: null },
        status: "queued",
        progress: 0,
        bytes: 0,
        uri: fileFor(meta.episodeId),
      };
      const items = { ...get().items, [meta.episodeId]: item };
      set({ items });
      await persist(items);
      try {
        const playback = await playbackUrl(meta.episodeId);
        update(meta.episodeId, {
          meta: {
            ...item.meta,
            duration: Number(playback.duration_seconds ?? 0),
            nextEpisodeId: playback.next_episode_id,
          },
        });
        await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(
          () => undefined,
        );
        void track("download_started", meta.episodeId, 0);
        await start(get().items[meta.episodeId]!, playback.url);
      } catch (error) {
        update(meta.episodeId, {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    pause: async (episodeId) => {
      const task = tasks.get(episodeId);
      update(episodeId, { status: "paused" });
      if (task) {
        const state = await task.pauseAsync();
        update(episodeId, { resumeData: state.resumeData });
      }
    },
    resume: async (episodeId) => {
      const item = get().items[episodeId];
      if (!item || (item.status !== "paused" && item.status !== "failed"))
        return;
      try {
        // Signed URLs expire, so a resumed download asks for a fresh one.
        const playback = await playbackUrl(episodeId);
        await start(item, playback.url, item.resumeData);
      } catch (error) {
        update(episodeId, {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    remove: async (episodeId) => {
      const task = tasks.get(episodeId);
      if (task) await task.pauseAsync().catch(() => undefined);
      tasks.delete(episodeId);
      await FileSystem.deleteAsync(fileFor(episodeId), {
        idempotent: true,
      }).catch(() => undefined);
      const { [episodeId]: _removed, ...items } = get().items;
      set({ items });
      await persist(items);
      await api
        .DELETE("/api/v1/me/downloads/{episode_id}", {
          params: { path: { episode_id: episodeId } },
        })
        .catch(() => undefined);
    },
    removeAll: async () => {
      for (const episodeId of Object.keys(get().items))
        await get().remove(episodeId);
    },
    clearLocal: async () => {
      for (const task of tasks.values())
        await task.pauseAsync().catch(() => undefined);
      tasks.clear();
      await FileSystem.deleteAsync(DIR, { idempotent: true }).catch(
        () => undefined,
      );
      set({ items: {} });
      await persist({});
    },
    /**
     * Reconciles with the server: episodes that are no longer published are deleted from the
     * device; downloads finished while offline are registered.
     */
    sync: async () => {
      try {
        const { data } = await api.GET("/api/v1/me/downloads");
        if (!data) return;
        const server = new Map(data.map((d) => [d.episode_id, d]));
        for (const [episodeId, item] of Object.entries(get().items)) {
          const row = server.get(episodeId);
          if (row && !row.available) await get().remove(episodeId);
          else if (!row && item.status === "done") {
            await api
              .POST("/api/v1/me/downloads", { body: { episode_id: episodeId } })
              .catch(() => undefined);
          }
        }
      } catch {
        // Offline: try again later.
      }
    },
  };
});
