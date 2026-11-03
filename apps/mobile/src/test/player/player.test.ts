import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useDownloads } from "@/downloads/store";
import { useSession } from "@/lib/session";
import {
  flushEvents,
  pendingEvents,
  resetEventQueueForTests,
} from "@/events/queue";
import { setEngine } from "@/player/engine";
import { FakeEngine } from "@/player/fakeEngine";
import {
  localProgress,
  resetProgressForTests,
  resumePosition,
  saveProgress,
} from "@/player/progress";
import { resetPlayerForTests, usePlayer } from "@/player/store";
import {
  episode,
  json,
  mockFetch,
  resetState,
  series,
  signedIn,
  type Route,
} from "../helpers";

const playback = (id: string, next: string | null) =>
  json({
    episode_id: id,
    series_id: "s1",
    url: `https://media/${id}.mp3?sig=x`,
    format: "mp3",
    duration_seconds: "600.0",
    next_episode_id: next,
  });

const routes = (extra: Route[] = []): Route[] => [
  ...extra,
  { path: "/api/v1/episodes/e1/playback", respond: () => playback("e1", "e2") },
  { path: "/api/v1/episodes/e2/playback", respond: () => playback("e2", null) },
  { path: "/api/v1/series/s1", respond: () => json(series()) },
  {
    path: "/api/v1/series/s1/episodes",
    respond: () => json([episode(1), episode(2)]),
  },
  {
    method: "POST",
    path: "/api/v1/events",
    respond: () => json({ accepted: 1, duplicates: 0, rejected: [] }),
  },
  { method: "PUT", path: "/api/v1/me/progress/e1", respond: () => json({}) },
  { method: "PUT", path: "/api/v1/me/progress/e2", respond: () => json({}) },
  {
    method: "POST",
    path: "/api/v1/me/downloads",
    respond: () => json({}, 201),
  },
  {
    method: "DELETE",
    path: "/api/v1/me/downloads/e1",
    respond: () => new Response(null, { status: 204 }),
  },
];

const offline = () => {
  globalThis.fetch = jest.fn(async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;
};

const player = () => usePlayer.getState();
const types = async () => (await pendingEvents()).map((e) => e.type);
let engine: FakeEngine;

beforeEach(async () => {
  await player().stop();
  engine = new FakeEngine();
  setEngine(engine);
  await resetState();
  resetPlayerForTests();
  resetProgressForTests();
  resetEventQueueForTests();
  useDownloads.setState({ ready: true, items: {} });
  jest.clearAllMocks();
  await signedIn();
  await useSession.getState().load();
});

afterEach(() => jest.restoreAllMocks());

describe("resume", () => {
  it("starts from the newer of the device and server positions", async () => {
    mockFetch(routes());
    await saveProgress("e1", 100, false);
    await player().start("e1", {
      server: { position: 300, updatedAt: "2020-01-01T00:00:00Z" },
    });
    expect(engine.loads.at(-1)!.startAt).toBe(100);
    await player().stop();

    await player().start("e1", {
      server: { position: 300, updatedAt: "2999-01-01T00:00:00Z" },
    });
    expect(engine.loads.at(-1)!.startAt).toBe(300);
  });

  it("keeps the position within 5 seconds even if the app is killed", async () => {
    mockFetch(routes());
    await player().start("e1");
    engine.advance(13);
    await settle(); // let the periodic save reach storage
    resetProgressForTests(); // the app restarts: only what reached storage survives
    const position = await resumePosition("e1");
    expect(position).toBeGreaterThanOrEqual(13 - 5);
    expect(position).toBeLessThanOrEqual(13);
  });

  it("starts a finished episode from the beginning", async () => {
    await saveProgress("e1", 600, true);
    expect(await resumePosition("e1")).toBe(0);
  });
});

describe("sleep timer", () => {
  it("pauses when the timer runs out", async () => {
    mockFetch(routes());
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    await player().start("e1");
    player().setSleep(15);
    engine.advance(30);
    expect(player().playing).toBe(true);
    clock.mockReturnValue(now + 15 * 60_000 + 1);
    engine.advance(1);
    expect(player().playing).toBe(false);
    expect(engine.playing).toBe(false);
    expect(player().sleep).toEqual({ mode: "off" });
  });

  it("'end of episode' stops at the end instead of moving on", async () => {
    mockFetch(routes());
    await player().start("e1");
    player().setSleep("end");
    engine.advance(700);
    await Promise.resolve();
    expect(engine.loads).toHaveLength(1);
    expect(player().playing).toBe(false);
    expect(player().current?.episodeId).toBe("e1");
    expect((await localProgress("e1"))?.completed).toBe(true);
  });
});

describe("auto-advance and speed", () => {
  it("plays the next episode, keeps the speed and records the events", async () => {
    mockFetch(routes());
    await player().start("e1");
    player().setRate(1.5);
    engine.advance(400); // 400 s at 1.5x reaches the end of the 600 s episode
    await waitForLoads(2);
    expect(engine.loads[1]!.track.id).toBe("e2");
    expect(engine.rate).toBe(1.5);
    expect(player().current?.title).toBe("Bells");
    const events = await pendingEvents();
    expect(events.map((e) => e.type)).toEqual([
      "play_started",
      "play_completed",
      "next_episode_started",
      "play_started",
    ]);
    expect(events[2]).toMatchObject({ episode_id: "e1", to_episode_id: "e2" });

    // The speed survives a restart.
    expect(await AsyncStorage.getItem("bibi.rate")).toBe("1.5");
    resetPlayerForTests();
    await player().loadRate();
    expect(player().rate).toBe(1.5);
  });

  it("records pause, resume and a drop-off when closed early", async () => {
    mockFetch(routes());
    await player().start("e1");
    engine.advance(20);
    player().pause();
    player().resume();
    await player().stop();
    expect(await types()).toEqual([
      "play_started",
      "play_paused",
      "play_resumed",
      "drop_off",
    ]);
    expect((await pendingEvents()).at(-1)!.position_seconds).toBe(20);
  });
});

describe("offline", () => {
  it("plays a downloaded episode offline and sends the queued events later with their original times", async () => {
    const online = mockFetch(routes());
    await useDownloads.getState().download({
      episodeId: "e1",
      seriesId: "s1",
      seriesTitle: "Harbour Lights",
      title: "Fog",
      number: 1,
      previousEpisodeId: null,
    });
    expect(useDownloads.getState().items.e1).toMatchObject({
      status: "done",
      bytes: 9_600_000,
      uri: "file:///docs/episodes/e1.mp3",
    });
    expect(
      online.calls.some(
        (c) => c.method === "POST" && c.url.endsWith("/me/downloads"),
      ),
    ).toBe(true);
    await flushEvents();
    expect(await pendingEvents()).toEqual([]);

    offline();
    await player().start("e1");
    expect(engine.loads[0]!.track.url).toBe("file:///docs/episodes/e1.mp3");
    expect(player().source).toBe("download");
    expect(player().current).toMatchObject({
      title: "Fog",
      seriesTitle: "Harbour Lights",
      nextEpisodeId: "e2",
    });
    engine.advance(10);
    player().pause();
    await flushEvents();
    const queued = await pendingEvents();
    expect(queued.map((e) => e.type)).toEqual(["play_started", "play_paused"]);

    const back = mockFetch(routes());
    await flushEvents();
    expect(await pendingEvents()).toEqual([]);
    const sent = back.calls.find((c) => c.url.endsWith("/api/v1/events"))!
      .body as { events: typeof queued };
    expect(sent.events.map((e) => [e.client_event_id, e.client_ts])).toEqual(
      queued.map((e) => [e.client_event_id, e.client_ts]),
    );
  });

  it("deletes a downloaded episode that is no longer published on the next sync", async () => {
    mockFetch(routes());
    await useDownloads.getState().download({
      episodeId: "e1",
      seriesId: "s1",
      seriesTitle: "Harbour Lights",
      title: "Fog",
      number: 1,
      previousEpisodeId: null,
    });
    const { calls } = mockFetch(
      routes([
        {
          path: "/api/v1/me/downloads",
          respond: () =>
            json([
              {
                episode_id: "e1",
                available: false,
                downloaded_at: "2026-11-01T00:00:00Z",
              },
            ]),
        },
      ]),
    );
    await useDownloads.getState().sync();
    expect(useDownloads.getState().items.e1).toBeUndefined();
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      "file:///docs/episodes/e1.mp3",
      { idempotent: true },
    );
    expect(
      calls.some(
        (c) => c.method === "DELETE" && c.url.endsWith("/me/downloads/e1"),
      ),
    ).toBe(true);
  });

  it("pauses and resumes a download with a fresh URL", async () => {
    const { calls } = mockFetch(routes());
    const create = jest.mocked(FileSystem.createDownloadResumable);
    create.mockImplementationOnce(
      (url: string, fileUri: string) =>
        ({
          downloadAsync: jest.fn(async () => {
            await useDownloads.getState().pause("e1");
            return undefined; // a paused download resolves without a result
          }),
          resumeAsync: jest.fn(),
          pauseAsync: jest.fn(async () => ({
            url,
            fileUri,
            options: {},
            resumeData: "half",
          })),
          savable: jest.fn(),
        }) as unknown as FileSystem.DownloadResumable,
    );
    await useDownloads.getState().download({
      episodeId: "e1",
      seriesId: "s1",
      seriesTitle: "Harbour Lights",
      title: "Fog",
      number: 1,
      previousEpisodeId: null,
    });
    expect(useDownloads.getState().items.e1).toMatchObject({
      status: "paused",
      resumeData: "half",
    });
    await useDownloads.getState().resume("e1");
    expect(create).toHaveBeenLastCalledWith(
      "https://media/e1.mp3?sig=x",
      "file:///docs/episodes/e1.mp3",
      {},
      expect.any(Function),
      "half",
    );
    expect(useDownloads.getState().items.e1?.status).toBe("done");
    expect(calls.filter((c) => c.url.endsWith("/e1/playback"))).toHaveLength(2);
  });
});

async function settle() {
  for (let i = 0; i < 10; i += 1) await new Promise((r) => setTimeout(r, 0));
}

async function waitForLoads(count: number) {
  for (let i = 0; i < 50 && engine.loads.length < count; i += 1)
    await new Promise((r) => setTimeout(r, 0));
}
