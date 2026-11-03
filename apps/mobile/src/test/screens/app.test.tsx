import NetInfo from "@react-native-community/netinfo";
import {
  fireEvent,
  renderRouter,
  screen,
  waitFor,
  within,
} from "expo-router/testing-library";
import { useSession } from "@/lib/session";
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

describe("auth", () => {
  it("shows sign in when signed out and signs in", async () => {
    const { calls } = mockFetch([
      {
        method: "POST",
        path: "/api/v1/auth/login",
        respond: () =>
          json({
            access_token: "a",
            refresh_token: "r",
            token_type: "bearer",
            expires_in: 900,
            user: {
              id: "u1",
              email: "lena@example.com",
              role: "listener",
              display_name: null,
              status: "active",
            },
          }),
      },
      ...listenerRoutes(),
    ]);
    await renderApp();
    await fireEvent.changeText(
      await screen.findByLabelText("Email"),
      "lena@example.com",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      "secret-pass",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByLabelText("Shelf Quiet nights")).toBeTruthy();
    expect(calls.find((c) => c.url.endsWith("/auth/login"))!.body).toEqual({
      email: "lena@example.com",
      password: "secret-pass",
    });
    expect(useSession.getState().tokens?.accessToken).toBe("a");
  });

  it("shows the server's sign-in error", async () => {
    mockFetch([
      {
        method: "POST",
        path: "/api/v1/auth/login",
        respond: () =>
          json(
            {
              error: {
                code: "invalid_credentials",
                message: "Email or password is wrong",
                details: {},
                request_id: null,
              },
            },
            401,
          ),
      },
    ]);
    await renderApp();
    await fireEvent.changeText(
      await screen.findByLabelText("Email"),
      "lena@example.com",
    );
    await fireEvent.changeText(screen.getByLabelText("Password"), "nope-nope");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email or password is wrong")).toBeTruthy();
  });
});

describe("home", () => {
  it("puts continue listening above the shelves and labels AI stories", async () => {
    await signedIn();
    mockFetch(listenerRoutes());
    await renderApp();
    const shelf = await screen.findByLabelText("Shelf Quiet nights");
    expect(within(shelf).getByText("Harbour Lights")).toBeTruthy();
    expect(within(shelf).getByLabelText("AI-assisted story")).toBeTruthy();
    const resume = await screen.findByLabelText("Continue Harbour Lights");
    expect(resume).toBeTruthy();
    // Continue listening is rendered before the first shelf.
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"Continue listening"')).toBeGreaterThan(-1);
    expect(tree.indexOf('"Continue listening"')).toBeLessThan(
      tree.indexOf('"Shelf Quiet nights"'),
    );
  });
});

describe("series", () => {
  it("continues from the saved position", async () => {
    await signedIn();
    mockFetch(listenerRoutes());
    const app = await renderApp("/series/s1");
    expect(
      await screen.findByText("A lighthouse keeper hears a bell no one rings."),
    ).toBeTruthy();
    expect(screen.getByLabelText("Play episode 1, Fog")).toBeTruthy();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Continue episode 2" }),
    );
    await waitFor(() => expect(app.getPathname()).toBe("/player/e2"));
    expect(app.getSearchParams()).toMatchObject({ position: "120" });
  });

  it("starts at episode 1 without progress", async () => {
    await signedIn();
    mockFetch(
      listenerRoutes([
        { path: "/api/v1/me/progress", respond: () => json([]) },
      ]),
    );
    const app = await renderApp("/series/s1");
    await fireEvent.press(
      await screen.findByRole("button", { name: "Play episode 1" }),
    );
    await waitFor(() => expect(app.getPathname()).toBe("/player/e1"));
  });
});

describe("settings", () => {
  it("deletes the account after confirming and signs out", async () => {
    await signedIn();
    const { calls } = mockFetch(
      listenerRoutes([
        {
          method: "DELETE",
          path: "/api/v1/me",
          respond: () => new Response(null, { status: 204 }),
        },
      ]),
    );
    await renderApp("/settings");
    await fireEvent.press(
      await screen.findByRole("button", { name: "Delete account…" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Delete my account" }),
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "DELETE" && c.url.endsWith("/api/v1/me"),
        ),
      ).toBe(true),
    );
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(useSession.getState().user).toBeNull();
  });
});
