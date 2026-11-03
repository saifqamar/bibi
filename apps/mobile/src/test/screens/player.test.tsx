import NetInfo from "@react-native-community/netinfo";
import {
  fireEvent,
  renderRouter,
  screen,
  waitFor,
  within,
} from "expo-router/testing-library";
import { useDownloads } from "@/downloads/store";
import { resetEventQueueForTests } from "@/events/queue";
import { setEngine } from "@/player/engine";
import { FakeEngine } from "@/player/fakeEngine";
import { resetProgressForTests } from "@/player/progress";
import { resetPlayerForTests, usePlayer } from "@/player/store";
import {
  episode,
  json,
  mockFetch,
  progress,
  resetState,
  series,
  signedIn,
} from "../helpers";

const playback = (id: string, next: string | null) =>
  json({
    episode_id: id,
    series_id: "s1",
    url: `https://media/${id}.mp3`,
    format: "mp3",
    duration_seconds: "600.0",
    next_episode_id: next,
  });

const routes = () => [
  { path: "/api/v1/episodes/e1/playback", respond: () => playback("e1", "e2") },
  { path: "/api/v1/episodes/e2/playback", respond: () => playback("e2", null) },
  { path: "/api/v1/series/s1", respond: () => json(series()) },
  {
    path: "/api/v1/series/s1/episodes",
    respond: () => json([episode(1), episode(2)]),
  },
  {
    path: "/api/v1/shelves",
    respond: () => json({ items: [], total: 0, limit: 30, offset: 0 }),
  },
  { path: "/api/v1/me/progress", respond: () => json([progress()]) },
  { path: "/api/v1/me/downloads", respond: () => json([]) },
  {
    method: "POST",
    path: "/api/v1/events",
    respond: () => json({ accepted: 1, duplicates: 0, rejected: [] }),
  },
  { method: "PUT", path: "/api/v1/me/progress/e2", respond: () => json({}) },
  {
    method: "POST",
    path: "/api/v1/me/downloads",
    respond: () => json({}, 201),
  },
];

let engine: FakeEngine;

beforeEach(async () => {
  await usePlayer.getState().stop();
  engine = new FakeEngine();
  setEngine(engine);
  await resetState();
  resetPlayerForTests();
  resetProgressForTests();
  resetEventQueueForTests();
  useDownloads.setState({ ready: true, items: {} });
  jest
    .mocked(NetInfo.useNetInfo)
    .mockReturnValue({ isConnected: true } as never);
  await signedIn();
});

it("plays from the server position with the AI label, speed and sleep controls", async () => {
  mockFetch(routes());
  await renderRouter("./src/app", {
    initialUrl:
      "/player/e2?position=120&updatedAt=2026-11-02T10:00:00Z&completed=false",
  });
  expect(await screen.findByText("2. Bells")).toBeTruthy();
  expect(screen.getByLabelText("AI-assisted story")).toBeTruthy();
  expect(engine.loads[0]).toMatchObject({ startAt: 120 });
  expect(engine.playing).toBe(true);

  await fireEvent.press(screen.getByRole("button", { name: "Speed 1.25x" }));
  expect(engine.rate).toBe(1.25);
  await fireEvent.press(
    screen.getByRole("button", { name: "Forward 15 seconds" }),
  );
  expect(engine.position).toBe(135);
  await fireEvent.press(
    screen.getByRole("button", { name: "Sleep at end of episode" }),
  );
  expect(screen.getByText("Sleep: end of episode")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Pause" }));
  expect(engine.playing).toBe(false);
  expect(screen.getByRole("button", { name: "Next episode" })).toBeDisabled();
});

it("shows the mini player on the tabs while something plays", async () => {
  mockFetch(routes());
  await usePlayer.getState().start("e1");
  await renderRouter("./src/app", { initialUrl: "/" });
  const mini = await screen.findByLabelText("Mini player");
  expect(within(mini).getByText("Fog")).toBeTruthy();
  await fireEvent.press(within(mini).getByRole("button", { name: "Pause" }));
  expect(engine.playing).toBe(false);
  await fireEvent.press(
    within(mini).getByRole("button", { name: "Stop and close player" }),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText("Mini player")).toBeNull(),
  );
});

it("downloads an episode from the series page", async () => {
  mockFetch(routes());
  await renderRouter("./src/app", { initialUrl: "/series/s1" });
  await fireEvent.press(
    await screen.findByRole("button", { name: "Download episode 1" }),
  );
  await waitFor(() =>
    expect(useDownloads.getState().items.e1?.status).toBe("done"),
  );
  expect(
    await screen.findByRole("button", { name: "Remove download of episode 1" }),
  ).toBeTruthy();
});
