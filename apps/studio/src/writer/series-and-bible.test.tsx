import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn } from "@/test/render";

const SERIES_ID = "11111111-1111-1111-1111-111111111111";

const series = {
  id: SERIES_ID,
  owner_writer_id: "u1",
  title: "The Lighthouse",
  premise: "A keeper hears bells.",
  language: "en",
  tone: "quiet",
  themes: ["grief"],
  target_episode_minutes: 18,
  status: "draft",
  is_ai_assisted: true,
  free_episode_count: 1,
  play_count: 0,
  published_at: null,
  cover_url: null,
  created_at: "2026-11-03T00:00:00Z",
  updated_at: "2026-11-03T00:00:00Z",
};

const ana = {
  id: "c-ana",
  series_id: SERIES_ID,
  name: "Ana",
  description: "The keeper",
  traits: [],
  voice_notes: "",
  is_narrator: false,
  created_at: "",
  updated_at: "",
};

const emptyBible = { characters: [], relationships: [], locations: [], world_rules: [], timeline: [], plot_threads: [] };

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("series", () => {
  it("lists the writer's series", async () => {
    mockFetch([
      { path: "/api/v1/studio/series", respond: () => jsonResponse({ items: [series], total: 1, limit: 100, offset: 0 }) },
    ]);
    renderApp("/writer");
    expect(await screen.findByText("The Lighthouse")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("creates a series and opens it", async () => {
    const { calls } = mockFetch([
      { method: "POST", path: "/api/v1/studio/series", respond: () => jsonResponse(series, 201) },
      { path: `/api/v1/studio/series/${SERIES_ID}`, respond: () => jsonResponse(series) },
      { path: `/api/v1/studio/series/${SERIES_ID}/canon-proposals`, respond: () => jsonResponse([]) },
    ]);
    const { router } = renderApp("/writer/series/new");
    await userEvent.type(screen.getByLabelText("Title"), "The Lighthouse");
    await userEvent.type(screen.getByLabelText("Themes"), "grief, the sea");
    await userEvent.click(screen.getByRole("button", { name: "Create series" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/writer/series/${SERIES_ID}`));
    const body = await calls.find((c) => c.method === "POST")!.json();
    expect(body).toMatchObject({ title: "The Lighthouse", themes: ["grief", "the sea"], language: "en" });
  });
});

describe("story bible", () => {
  function bibleRoutes(bible: object) {
    return [
      { path: `/api/v1/studio/series/${SERIES_ID}`, respond: () => jsonResponse(series) },
      { path: `/api/v1/studio/series/${SERIES_ID}/canon-proposals`, respond: () => jsonResponse([]) },
      { path: `/api/v1/studio/series/${SERIES_ID}/bible`, respond: () => jsonResponse(bible) },
    ];
  }

  it("adds a character", async () => {
    const { calls } = mockFetch([
      ...bibleRoutes(emptyBible),
      { method: "POST", path: `/api/v1/studio/series/${SERIES_ID}/characters`, respond: () => jsonResponse(ana, 201) },
    ]);
    renderApp(`/writer/series/${SERIES_ID}/bible/characters`);
    await userEvent.click(await screen.findByRole("button", { name: "Add character" }));
    await userEvent.type(screen.getByLabelText("Name"), "Ana");
    await userEvent.type(screen.getByLabelText("Traits"), "brave, tired");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    const body = await calls.find((c) => c.method === "POST")!.json();
    expect(body).toMatchObject({ name: "Ana", traits: ["brave", "tired"], is_narrator: false });
  });

  it("asks for confirmation before deleting a character that is still used", async () => {
    let forced = false;
    mockFetch([
      ...bibleRoutes({ ...emptyBible, characters: [ana] }),
      {
        method: "DELETE",
        path: `/api/v1/studio/series/${SERIES_ID}/characters/c-ana`,
        respond: (request) => {
          if (new URL(request.url).searchParams.get("force") === "true") {
            forced = true;
            return new Response(null, { status: 204 });
          }
          return jsonResponse(
            { error: { code: "entity_in_use", message: "in use", details: { references: ["1 relationship(s)"] }, request_id: null } },
            409,
          );
        },
      },
    ]);
    renderApp(`/writer/series/${SERIES_ID}/bible/characters`);
    await userEvent.click(await screen.findByRole("button", { name: "Delete Ana" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("1 relationship(s)");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete anyway" }));
    await waitFor(() => expect(forced).toBe(true));
  });
});

describe("canon proposals", () => {
  it("shows a diff and accepts a proposal", async () => {
    const proposal = {
      id: "p1",
      series_id: SERIES_ID,
      episode_id: null,
      entity_type: "characters",
      op: "update",
      entity_id: "c-ana",
      payload: { description: "The keeper, now blind" },
      current: { ...ana },
      reason: "Episode 3 says she lost her sight",
      status: "pending",
      decided_by: null,
      decided_at: null,
      created_at: "",
    };
    const { calls } = mockFetch([
      { path: `/api/v1/studio/series/${SERIES_ID}`, respond: () => jsonResponse(series) },
      { path: `/api/v1/studio/series/${SERIES_ID}/canon-proposals`, respond: () => jsonResponse([proposal]) },
      { method: "POST", path: "/api/v1/studio/canon-proposals/p1/accept", respond: () => jsonResponse({ ...proposal, status: "accepted" }) },
    ]);
    renderApp(`/writer/series/${SERIES_ID}/proposals`);
    const card = await screen.findByRole("article", { name: "Proposal update characters" });
    expect(card).toHaveTextContent("The keeper");
    expect(card).toHaveTextContent("The keeper, now blind");
    await userEvent.click(within(card).getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/p1/accept"))).toBe(true));
  });
});
