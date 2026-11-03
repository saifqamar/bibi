import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { localFile, type EpisodeMeta } from "@/downloads/store";
import { flushEvents, track } from "@/events/queue";
import { api } from "@/lib/api";
import { getEngine, type EngineStatus } from "./engine";
import { resumePosition, saveProgress, syncProgress } from "./progress";

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const SLEEP_MINUTES = [15, 30, 45, 60] as const;
export const SKIP_SECONDS = 15;
const SAVE_EVERY_SECONDS = 5;
const RATE_KEY = "bibi.rate";

export type Sleep =
  | { mode: "off" }
  | { mode: "timer"; minutes: number; endsAt: number }
  | { mode: "end" };

export interface StartOptions {
  /** Server position from /me/progress and when it was saved; the newer of this and local wins. */
  server?: { position: number; updatedAt: string; completed?: boolean } | null;
}

interface PlayerState {
  current: EpisodeMeta | null;
  source: "stream" | "download" | null;
  position: number;
  duration: number;
  playing: boolean;
  loading: boolean;
  error: string | null;
  rate: number;
  sleep: Sleep;
  start: (episodeId: string, options?: StartOptions) => Promise<void>;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  seekBy: (seconds: number) => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setRate: (rate: number) => void;
  setSleep: (sleep: "off" | "end" | number) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  stop: () => Promise<void>;
  /** Saves the current position on the device now (e.g. when the app goes to the background). */
  saveNow: () => void;
  loadRate: () => Promise<void>;
}

/** Episode details for the player: from the network, or from the download when offline. */
async function episodeMeta(
  episodeId: string,
): Promise<{ meta: EpisodeMeta; url: string; source: "stream" | "download" }> {
  const downloaded = localFile(episodeId);
  if (downloaded)
    return { meta: downloaded.meta, url: downloaded.uri, source: "download" };
  const playback = await api.GET("/api/v1/episodes/{episode_id}/playback", {
    params: { path: { episode_id: episodeId } },
  });
  if (!playback.data)
    throw new Error("This episode is not available right now.");
  const seriesId = playback.data.series_id;
  const [series, episodes] = await Promise.all([
    api.GET("/api/v1/series/{series_id}", {
      params: { path: { series_id: seriesId } },
    }),
    api.GET("/api/v1/series/{series_id}/episodes", {
      params: { path: { series_id: seriesId } },
    }),
  ]);
  const list = episodes.data ?? [];
  const index = list.findIndex((e) => e.id === episodeId);
  const episode = list[index];
  return {
    url: playback.data.url,
    source: "stream",
    meta: {
      episodeId,
      seriesId,
      seriesTitle: series.data?.title ?? "",
      coverUrl: series.data?.cover_url ?? null,
      title: episode?.title ?? "",
      number: episode?.number ?? 0,
      duration: Number(playback.data.duration_seconds ?? 0),
      previousEpisodeId: index > 0 ? list[index - 1]!.id : null,
      nextEpisodeId: playback.data.next_episode_id,
    },
  };
}

export const usePlayer = create<PlayerState>()((set, get) => {
  let unsubscribe: (() => void) | null = null;
  let subscribed: ReturnType<typeof getEngine> | null = null;
  let lastSaved = 0;
  let completed = false;

  const save = (done = false) => {
    const { current, position } = get();
    if (!current) return;
    lastSaved = position;
    void saveProgress(
      current.episodeId,
      done ? get().duration || position : position,
      done,
    );
  };

  const finish = async () => {
    const { current, sleep } = get();
    if (!current || completed) return;
    completed = true;
    save(true);
    void track("play_completed", current.episodeId, get().duration);
    if (sleep.mode === "end") {
      // "End of episode" means stop here instead of moving on.
      set({ playing: false, sleep: { mode: "off" } });
      void syncProgress();
      return;
    }
    if (current.nextEpisodeId) {
      void track("next_episode_started", current.episodeId, get().duration, {
        to_episode_id: current.nextEpisodeId,
      });
      await get().start(current.nextEpisodeId);
    } else {
      set({ playing: false });
      void syncProgress();
    }
  };

  const onStatus = (status: EngineStatus) => {
    set({
      position: status.position,
      duration: status.duration || get().duration,
      playing: status.playing,
    });
    const { sleep } = get();
    if (
      sleep.mode === "timer" &&
      Date.now() >= sleep.endsAt &&
      status.playing
    ) {
      set({ sleep: { mode: "off" } });
      get().pause();
      return;
    }
    if (status.ended) {
      void finish();
      return;
    }
    if (Math.abs(status.position - lastSaved) >= SAVE_EVERY_SECONDS) save();
  };

  return {
    current: null,
    source: null,
    position: 0,
    duration: 0,
    playing: false,
    loading: false,
    error: null,
    rate: 1,
    sleep: { mode: "off" },

    loadRate: async () => {
      const saved = Number(
        await AsyncStorage.getItem(RATE_KEY).catch(() => null),
      );
      if ((SPEEDS as readonly number[]).includes(saved)) set({ rate: saved });
    },

    start: async (episodeId, options = {}) => {
      const previous = get().current;
      if (previous && previous.episodeId === episodeId) {
        if (!get().playing) get().resume();
        return;
      }
      if (previous && !completed) {
        save();
        void track("drop_off", previous.episodeId, get().position);
      }
      set({ loading: true, error: null });
      try {
        const { meta, url, source } = await episodeMeta(episodeId);
        const startAt = await resumePosition(episodeId, options.server);
        const engine = getEngine();
        if (subscribed !== engine) {
          unsubscribe?.();
          unsubscribe = engine.onStatus(onStatus);
          subscribed = engine;
        }
        completed = false;
        lastSaved = startAt;
        set({
          current: meta,
          source,
          position: startAt,
          duration: meta.duration,
          loading: false,
        });
        await engine.load(
          {
            id: episodeId,
            url,
            title: meta.title,
            artist: meta.seriesTitle,
            artworkUrl: meta.coverUrl,
          },
          startAt,
        );
        engine.setRate(get().rate);
        engine.play();
        void track("play_started", episodeId, startAt);
      } catch (error) {
        set({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not play this episode.",
        });
      }
    },

    toggle: () => (get().playing ? get().pause() : get().resume()),

    pause: () => {
      const { current, position } = get();
      if (!current) return;
      getEngine().pause();
      set({ playing: false });
      save();
      void track("play_paused", current.episodeId, position);
      void syncProgress();
      void flushEvents();
    },

    resume: () => {
      const { current, position } = get();
      if (!current) return;
      getEngine().play();
      set({ playing: true });
      void track("play_resumed", current.episodeId, position);
    },

    seekBy: (seconds) => get().seekTo(get().position + seconds),

    seekTo: async (seconds) => {
      const target = Math.max(0, Math.min(get().duration || Infinity, seconds));
      await getEngine().seekTo(target);
      set({ position: target });
      save();
    },

    setRate: (rate) => {
      set({ rate });
      getEngine().setRate(rate);
      void AsyncStorage.setItem(RATE_KEY, String(rate)).catch(() => undefined);
    },

    setSleep: (sleep) =>
      set({
        sleep:
          sleep === "off"
            ? { mode: "off" }
            : sleep === "end"
              ? { mode: "end" }
              : {
                  mode: "timer",
                  minutes: sleep,
                  endsAt: Date.now() + sleep * 60_000,
                },
      }),

    next: async () => {
      const current = get().current;
      if (!current?.nextEpisodeId) return;
      void track("next_episode_started", current.episodeId, get().position, {
        to_episode_id: current.nextEpisodeId,
      });
      await get().start(current.nextEpisodeId);
    },

    previous: async () => {
      const current = get().current;
      if (!current) return;
      // Like most players: restart the episode unless it has barely begun.
      if (get().position > 5 || !current.previousEpisodeId)
        await get().seekTo(0);
      else await get().start(current.previousEpisodeId);
    },

    saveNow: () => save(),

    stop: async () => {
      const { current, position } = get();
      if (!current) return;
      if (!completed) {
        save();
        void track("drop_off", current.episodeId, position);
      }
      getEngine().unload();
      unsubscribe?.();
      unsubscribe = null;
      subscribed = null;
      set({
        current: null,
        source: null,
        playing: false,
        position: 0,
        duration: 0,
        sleep: { mode: "off" },
      });
      void syncProgress();
      void flushEvents();
    },
  };
});

/** Test helper: clears the player without touching the engine. */
export function resetPlayerForTests(): void {
  usePlayer.setState({
    current: null,
    source: null,
    position: 0,
    duration: 0,
    playing: false,
    loading: false,
    error: null,
    rate: 1,
    sleep: { mode: "off" },
  });
}
