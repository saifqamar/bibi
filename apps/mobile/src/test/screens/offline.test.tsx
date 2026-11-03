import NetInfo from "@react-native-community/netinfo";
import {
  act,
  renderRouter,
  screen,
} from "expo-router/testing-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  episode,
  json,
  mockFetch,
  progress,
  resetState,
  series,
  signedIn,
} from "../helpers";

const shelves = (
  items = [
    { id: "sh1", title: "Quiet nights", kind: "mood", series: [series()] },
  ],
) => json({ items, total: items.length, limit: 30, offset: 0 });

const listenerRoutes = (extra: Parameters<typeof mockFetch>[0] = []) => [
  ...extra,
  { path: "/api/v1/shelves", respond: () => shelves() },
  { path: "/api/v1/me/progress", respond: () => json([progress()]) },
  { path: "/api/v1/series/s1", respond: () => json(series()) },
  {
    path: "/api/v1/series/s1/episodes",
    respond: () => json([episode(1), episode(2)]),
  },
];

const renderApp = (initialUrl = "/") =>
  renderRouter("./src/app", { initialUrl });

beforeEach(async () => {
  await resetState();
  jest
    .mocked(NetInfo.useNetInfo)
    .mockReturnValue({ isConnected: true } as never);
});

// Own file: the offline run leaves module-level query state behind that would leak into others.
describe("offline", () => {
  it("opens offline from the saved cache and says so", async () => {
    await signedIn();
    mockFetch(listenerRoutes());
    const first = await renderApp();
    await screen.findByLabelText("Shelf Quiet nights");
    // renderRouter uses fake timers; let the persister's write throttle elapse.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1500);
    });
    expect(await AsyncStorage.getItem("bibi.query-cache")).toContain(
      "Quiet nights",
    );
    first.unmount();

    jest
      .mocked(NetInfo.useNetInfo)
      .mockReturnValue({ isConnected: false } as never);
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError("Network request failed");
    }) as typeof fetch;
    await renderApp();
    expect(await screen.findByLabelText("Shelf Quiet nights")).toBeTruthy();
    expect(
      screen.getByText("You are offline. Showing saved stories."),
    ).toBeTruthy();
  });
});
