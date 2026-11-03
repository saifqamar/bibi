import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn, type MockRoute } from "@/test/render";

const SID = "s1";
const EID = "e1";
const TEXT = "The night was still.\nBen: I'm back, Ana.\nStranger: Who are you?";
const series = {
  id: SID, owner_writer_id: "u1", title: "Island", premise: "", language: "en", tone: "", themes: [],
  target_episode_minutes: 15, status: "draft", is_ai_assisted: true, free_episode_count: 1, play_count: 0,
  published_at: null, cover_url: null, created_at: "", updated_at: "",
};
const episode = {
  id: EID, series_id: SID, number: 1, title: "Night", status: "drafting", current_version: 1, word_count: 9,
  estimated_seconds: 4, target_seconds: 900, is_free: null, published_at: null,
  plan: { beats: [{ id: "b1", text: "x" }], notes: "" }, created_at: "", updated_at: "u",
};
const issue = (overrides: object) => ({
  id: "i1", episode_id: EID, workflow_run_id: "r1", draft_version: 1, severity: "error", type: "character_fact",
  description: "Ben died in episode 1 but speaks here.", quote: "Ben: I'm back, Ana.",
  source_ref: { kind: "bible", entity_type: "characters", excerpt: "Ben drowned." }, status: "open",
  resolution_note: "", resolved_at: null, created_at: "", ...overrides,
});

function routes(extra: MockRoute[] = []): MockRoute[] {
  return [
    ...extra,
    { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
    { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse({ summary: { total_usd: "0" }, episodes: [], budget: { soft_limit_usd: null, over_budget: false } }) },
    { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(episode) },
    { path: `/api/v1/studio/episodes/${EID}/workflow-runs`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/episodes/${EID}/drafts/1`, respond: () => jsonResponse({ version: 1, source: "ai", created_by: null, note: "", word_count: 9, estimated_seconds: 4, created_at: "", text: TEXT }) },
  ];
}

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("continuity tab", () => {
  it("shows open issues with the quote in context and resolves them", async () => {
    const { calls } = mockFetch(
      routes([
        {
          path: `/api/v1/studio/episodes/${EID}/continuity-issues`,
          respond: () =>
            jsonResponse([
              issue({}),
              issue({ id: "i2", severity: "warning", type: "naming", description: "Stranger is not in the bible.", quote: "Stranger:", source_ref: { kind: "bible", entity_type: "characters" } }),
              issue({ id: "i3", status: "intentional", description: "Old one", resolution_note: "ghost" }),
            ]),
        },
        { method: "POST", path: "/api/v1/studio/continuity-issues/i1/resolve", respond: () => jsonResponse(issue({ status: "intentional" })) },
        { method: "POST", path: "/api/v1/studio/continuity-issues/i2/resolve", respond: () => jsonResponse(issue({ id: "i2", status: "fixed" })) },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/continuity`);
    expect(await screen.findByText("1 error(s), 1 warning(s) open.")).toBeInTheDocument();
    const card = screen.getByRole("article", { name: /error: Ben died/ });
    expect(within(card).getByText("Ben: I'm back, Ana.", { selector: "mark" })).toBeInTheDocument();
    expect(within(card).getByText(/Story bible · characters: “Ben drowned.”/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Update the story bible" })).toHaveAttribute("href", `/writer/series/${SID}/bible/characters`);

    await userEvent.click(within(card).getByRole("button", { name: "It's intentional" }));
    const save = within(card).getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await userEvent.type(within(card).getByLabelText("Why is this intentional?"), "It is a ghost");
    await userEvent.click(save);
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/i1/resolve"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/i1/resolve"))!.json()).toEqual({ status: "intentional", note: "It is a ghost" });

    const warning = screen.getByRole("article", { name: /warning: Stranger/ });
    await userEvent.click(within(warning).getByRole("button", { name: "Mark fixed" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/i2/resolve"))).toBe(true));
    expect(screen.getByRole("region", { name: "Resolved issues" })).toHaveTextContent("ghost");
  });

  it("starts a check", async () => {
    const { calls } = mockFetch(
      routes([
        { path: `/api/v1/studio/episodes/${EID}/continuity-issues`, respond: () => jsonResponse([]) },
        { method: "POST", path: `/api/v1/studio/episodes/${EID}/workflows/continuity`, respond: () => jsonResponse({ id: "r9", status: "queued" }, 202) },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/continuity`);
    expect(await screen.findByText("No open issues.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Check continuity" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/workflows/continuity"))).toBe(true));
  });
});
