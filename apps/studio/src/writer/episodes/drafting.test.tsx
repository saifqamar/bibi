import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn, type MockRoute } from "@/test/render";

const SID = "s1";
const EID = "e1";
const series = {
  id: SID, owner_writer_id: "u1", title: "Bells", premise: "", language: "en", tone: "", themes: [],
  target_episode_minutes: 15, status: "draft", is_ai_assisted: true, free_episode_count: 1, play_count: 0,
  published_at: null, cover_url: null, created_at: "", updated_at: "",
};
const episode = (overrides: object = {}) => ({
  id: EID, series_id: SID, number: 1, title: "Fog", status: "drafting", current_version: 1, word_count: 4,
  estimated_seconds: 2, target_seconds: 900, is_free: null, published_at: null,
  plan: { beats: [{ id: "b1", text: "Ana hears a bell" }], notes: "" }, created_at: "", updated_at: "u", ...overrides,
});
const run = (overrides: object = {}) => ({
  id: "r1", workflow: "drafting", episode_id: EID, series_id: SID, status: "waiting", current_step: "writer_review",
  interrupt_payload: { kind: "draft_review", draft_version: 1 }, error: null, request_id: null, started_at: null,
  finished_at: null, created_at: "2026-11-03T10:00:00Z", cost_usd: "0", ...overrides,
});

function routes(runs: () => object[], extra: MockRoute[] = [], ep = episode()): MockRoute[] {
  return [
    ...extra,
    { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
    { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse({ summary: { total_usd: "0" }, episodes: [], budget: { soft_limit_usd: null, over_budget: false } }) },
    { path: `/api/v1/studio/series/${SID}/characters`, respond: () => jsonResponse([{ id: "c1", name: "Ana" }]) },
    { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(ep) },
    { path: `/api/v1/studio/episodes/${EID}/workflow-runs`, respond: () => jsonResponse(runs()) },
    { path: `/api/v1/studio/episodes/${EID}/drafts/1`, respond: () => jsonResponse({ version: 1, source: "ai", created_by: null, note: "", word_count: 4, estimated_seconds: 2, created_at: "", text: "Ana: Did you hear it?" }) },
  ];
}

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("drafting panel", () => {
  it("starts a drafting run and follows its progress", async () => {
    let runs: object[] = [];
    const { calls } = mockFetch(
      routes(() => runs, [
        {
          method: "POST",
          path: `/api/v1/studio/episodes/${EID}/workflows/drafting`,
          respond: () => {
            runs = [run({ status: "running", current_step: "draft", interrupt_payload: null })];
            return jsonResponse(runs[0], 202);
          },
        },
        {
          path: "/api/v1/studio/workflow-runs/r1/events",
          respond: () =>
            new Response('id: 1\nevent: progress\ndata: {"kind":"step","step":"load_context"}\n\nid: 2\nevent: progress\ndata: {"kind":"step","step":"draft"}\n\n'),
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    await userEvent.click(await screen.findByRole("button", { name: "Draft with AI" }));
    const panel = await screen.findByRole("region", { name: "AI drafting" });
    expect(await within(panel).findByText("Drafting the episode", { selector: "p" })).toBeInTheDocument();
    expect(await within(panel).findByText("Gathering the bible and earlier episodes")).toBeInTheDocument();
    expect(calls.some((c) => c.url.endsWith("/events") && c.headers.get("Authorization") === "Bearer access")).toBe(true);
  });

  it("needs beats before drafting", async () => {
    mockFetch(routes(() => [], [], episode({ plan: { beats: [], notes: "" } })));
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    expect(await screen.findByRole("button", { name: "Draft with AI" })).toBeDisabled();
    expect(screen.getByText("Add beats in the Plan tab first.")).toBeInTheDocument();
  });

  it("approves a draft waiting for review", async () => {
    const { calls } = mockFetch(
      routes(() => [run()], [{ method: "POST", path: "/api/v1/studio/workflow-runs/r1/resume", respond: () => jsonResponse(run({ status: "queued" }), 202) }]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    await userEvent.click(await screen.findByRole("button", { name: "Approve draft" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/resume"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/resume"))!.json()).toEqual({ payload: { action: "approve" } });
  });

  it("finishes after canon confirmation", async () => {
    const { calls } = mockFetch(
      routes(
        () => [run({ current_step: "confirm_canon", interrupt_payload: { kind: "canon_confirmation", proposal_ids: ["p1", "p2"] } })],
        [{ method: "POST", path: "/api/v1/studio/workflow-runs/r1/resume", respond: () => jsonResponse(run({ status: "queued" }), 202) }],
      ),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    expect(await screen.findByText("The AI suggests 2 canon update(s)")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done, finish the episode" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/resume"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/resume"))!.json()).toEqual({ payload: { action: "done" } });
  });

  it("offers a retry after a failed run", async () => {
    const { calls } = mockFetch(
      routes(
        () => [run({ status: "failed", interrupt_payload: null, error: "Provider overloaded [overloaded]" })],
        [{ method: "POST", path: "/api/v1/studio/workflow-runs/r1/resume", respond: () => jsonResponse(run({ status: "queued" }), 202) }],
      ),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    expect(await screen.findByText(/The last run failed: Provider overloaded/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry last run" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/resume"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/resume"))!.json()).toEqual({ payload: null });
  });
});

describe("regenerate selection", () => {
  async function selectFirstWord() {
    const editor = (await screen.findByLabelText("Episode script")) as HTMLTextAreaElement;
    await waitFor(() => expect(editor).toHaveValue("Ana: Did you hear it?"));
    editor.setSelectionRange(5, 8);
    fireEvent.select(editor);
  }

  it("sends the selection to the waiting review step", async () => {
    const { calls } = mockFetch(
      routes(() => [run()], [{ method: "POST", path: "/api/v1/studio/workflow-runs/r1/resume", respond: () => jsonResponse(run({ status: "queued" }), 202) }]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/editor`);
    await selectFirstWord();
    await userEvent.type(screen.getByLabelText(/Rewrite the selected passage/), "warmer");
    await userEvent.click(screen.getByRole("button", { name: "Regenerate selection" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/resume"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/resume"))!.json()).toEqual({
      payload: { action: "regenerate", sections: [{ start: 5, end: 8, note: "warmer" }] },
    });
  });

  it("starts a one-off rewrite when no run is active", async () => {
    const { calls } = mockFetch(
      routes(() => [], [{ method: "POST", path: `/api/v1/studio/episodes/${EID}/regenerate-section`, respond: () => jsonResponse(run({ workflow: "section_regen", status: "queued" }), 202) }]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/editor`);
    await selectFirstWord();
    await userEvent.click(screen.getByRole("button", { name: "Regenerate selection" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/regenerate-section"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/regenerate-section"))!.json()).toEqual({ sections: [{ start: 5, end: 8, note: "" }] });
  });
});
