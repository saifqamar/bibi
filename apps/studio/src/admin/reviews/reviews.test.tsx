import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn, type MockRoute } from "@/test/render";

const SID = "s1";
const EID = "e1";
const item = (overrides: object = {}) => ({
  id: "ri1", episode_id: EID, episode_number: 1, episode_title: "Fog", series_id: SID, series_title: "Harbour",
  writer_id: "u1", draft_version: 2, status: "pending", comments: "", submitted_at: "2026-11-03T10:00:00Z",
  decided_at: null, ...overrides,
});
const detail = (overrides: object = {}) => ({
  item: item(),
  episode_status: "in_review",
  is_live: false,
  text: "The fog came in.\nAna: Did you hear the bell?",
  audio: { id: "a1", url: "http://media/ep.mp3", format: "mp3", duration_seconds: "62.0", loudness_lufs: "-16.0", peak_dbfs: "-3.0", created_at: "" },
  continuity: [{ severity: "warning", type: "naming", description: "Stranger is not in the bible.", quote: "Stranger:", status: "intentional", resolution_note: "x" }],
  cost: { total_usd: "0.4200", input_tokens: 0, output_tokens: 0, embedding_tokens: 0, tts_characters: 0, by_purpose: [] },
  versions: [{ version: 1, source: "ai", created_by: null, note: "", word_count: 1, estimated_seconds: 1, created_at: "" }],
  ...overrides,
});

afterEach(() => vi.unstubAllGlobals());

describe("admin review", () => {
  beforeEach(() => {
    useAuth.getState().clear();
    signIn("admin");
  });

  it("lists the queue and approves with publish now", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/admin/review-queue", respond: () => jsonResponse({ items: [item()], total: 1, limit: 100, offset: 0 }) },
      { path: "/api/v1/admin/review-items/ri1", respond: () => jsonResponse(detail()) },
      { method: "POST", path: "/api/v1/admin/review-items/ri1/approve", respond: () => jsonResponse(item({ status: "approved" })) },
    ]);
    const { router } = renderApp("/admin");
    await userEvent.click(await screen.findByRole("link", { name: "1. Fog" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/reviews/ri1"));
    expect(await screen.findByText(/Did you hear the bell/)).toBeInTheDocument();
    expect(screen.getByLabelText("Episode audio")).toHaveAttribute("src", "http://media/ep.mp3");
    expect(screen.getByText("Stranger is not in the bible.")).toBeInTheDocument();
    expect(screen.getByText("AI cost $0.42")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByLabelText("Publish now")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/approve"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/approve"))!.json()).toEqual({ publish_now: true, comments: "" });
  });

  it("needs comments to request changes", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/admin/review-items/ri1", respond: () => jsonResponse(detail()) },
      { method: "POST", path: "/api/v1/admin/review-items/ri1/request-changes", respond: () => jsonResponse(item({ status: "changes_requested" })) },
    ]);
    renderApp("/admin/reviews/ri1");
    await userEvent.click(await screen.findByRole("button", { name: "Request changes" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Comments for the writer (required)"), "Slow the ending.");
    await userEvent.click(confirm);
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/request-changes"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/request-changes"))!.json()).toEqual({ comments: "Slow the ending." });
  });

  it("publishes an approved episode and can take a live one offline", async () => {
    let live = false;
    const { calls } = mockFetch([
      {
        path: "/api/v1/admin/review-items/ri1",
        respond: () => jsonResponse(detail({ item: item({ status: "approved" }), episode_status: live ? "published" : "approved", is_live: live })),
      },
      { method: "POST", path: `/api/v1/admin/episodes/${EID}/publish`, respond: () => ((live = true), new Response(null, { status: 204 })) },
      { method: "POST", path: `/api/v1/admin/episodes/${EID}/unpublish`, respond: () => ((live = false), new Response(null, { status: 204 })) },
    ]);
    renderApp("/admin/reviews/ri1");
    await userEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(await screen.findByText("Live for listeners")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Unpublish" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/unpublish"))).toBe(true));
  });
});

describe("writer side", () => {
  beforeEach(() => {
    useAuth.getState().clear();
    signIn("writer");
  });

  const series = {
    id: SID, owner_writer_id: "u1", title: "Harbour", premise: "", language: "en", tone: "", themes: [],
    target_episode_minutes: 15, status: "draft", is_ai_assisted: true, free_episode_count: 1, play_count: 0,
    published_at: null, cover_url: null, created_at: "", updated_at: "",
  };
  const episode = {
    id: EID, series_id: SID, number: 1, title: "Fog", status: "audio_ready", current_version: 2, word_count: 9,
    estimated_seconds: 4, target_seconds: 900, is_free: null, published_at: null,
    plan: { beats: [{ id: "b1", text: "x" }], notes: "" }, created_at: "", updated_at: "u",
  };
  const base = (extra: MockRoute[]): MockRoute[] => [
    ...extra,
    { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
    { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse({ summary: { total_usd: "0" }, episodes: [], budget: { soft_limit_usd: null, over_budget: false } }) },
    { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(episode) },
    { path: `/api/v1/studio/episodes/${EID}/workflow-runs`, respond: () => jsonResponse([]) },
  ];

  it("submits for review and shows the history", async () => {
    let reviews: object[] = [item({ id: "old", status: "changes_requested", comments: "Tighten the middle.", draft_version: 1, decided_at: "2026-11-02T10:00:00Z" })];
    const { calls } = mockFetch(
      base([
        { path: `/api/v1/studio/episodes/${EID}/reviews`, respond: () => jsonResponse(reviews) },
        {
          method: "POST",
          path: `/api/v1/studio/episodes/${EID}/submit`,
          respond: () => {
            reviews = [item(), ...reviews];
            return jsonResponse(item(), 201);
          },
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/review`);
    const history = await screen.findByRole("list", { name: "Review history" });
    expect(within(history).getByText("Tighten the middle.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/submit"))).toBe(true));
    expect(await within(history).findByText("pending")).toBeInTheDocument();
  });

  it("shows the server's reason when submitting is not possible", async () => {
    mockFetch(
      base([
        { path: `/api/v1/studio/episodes/${EID}/reviews`, respond: () => jsonResponse([]) },
        {
          method: "POST",
          path: `/api/v1/studio/episodes/${EID}/submit`,
          respond: () => jsonResponse({ error: { code: "audio_out_of_date", message: "The text changed since the audio was made; re-render the audio", details: {}, request_id: null } }, 409),
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/review`);
    await userEvent.click(await screen.findByRole("button", { name: "Submit for review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("re-render the audio");
  });

  it("shows unread notifications and marks them read", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/studio/series", respond: () => jsonResponse({ items: [], total: 0, limit: 100, offset: 0 }) },
      {
        path: "/api/v1/studio/notifications",
        respond: () => jsonResponse({ items: [{ id: "n1", kind: "approved", episode_id: EID, review_item_id: "ri1", message: "Your episode was approved.", read_at: null, created_at: "2026-11-03T10:00:00Z" }], unread: 1 }),
      },
      { method: "POST", path: "/api/v1/studio/notifications/n1/read", respond: () => new Response(null, { status: 204 }) },
    ]);
    renderApp("/writer");
    const bell = await screen.findByRole("button", { name: /Notifications\s*1/ });
    await userEvent.click(bell);
    await userEvent.click(within(screen.getByRole("list", { name: "Notifications" })).getByRole("button", { name: /approved/ }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/n1/read"))).toBe(true));
  });
});
