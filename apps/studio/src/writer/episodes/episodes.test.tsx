import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn, type MockRoute } from "@/test/render";

const SID = "s1";
const EID = "e1";
const series = {
  id: SID, owner_writer_id: "u1", title: "Harbour", premise: "", language: "en", tone: "", themes: [],
  target_episode_minutes: 15, status: "draft", is_ai_assisted: true, free_episode_count: 1, play_count: 0,
  published_at: null, cover_url: null, created_at: "", updated_at: "",
};
const episode = {
  id: EID, series_id: SID, number: 1, title: "Arrival", status: "drafting", current_version: 2,
  word_count: 3, estimated_seconds: 1, target_seconds: 900, is_free: null, published_at: null,
  plan: { beats: [{ id: "b1", text: "Ana arrives" }], notes: "" }, created_at: "", updated_at: "t1",
};
const draft = (version: number, text: string, source = "human") => ({
  version, source, created_by: null, note: "", word_count: 1, estimated_seconds: 1, created_at: "2026-11-03T10:00:00Z", text,
});

function routes(extra: MockRoute[] = []): MockRoute[] {
  return [
    ...extra,
    { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
    { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(episode) },
    { path: `/api/v1/studio/series/${SID}/characters`, respond: () => jsonResponse([{ id: "c1", name: "Ana" }]) },
    { path: `/api/v1/studio/episodes/${EID}/drafts/2`, respond: () => jsonResponse(draft(2, "Ana: Hello there.")) },
  ];
}

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("episodes", () => {
  it("lists episodes with length against target", async () => {
    mockFetch(routes([{ path: `/api/v1/studio/series/${SID}/episodes`, respond: () => jsonResponse([{ ...episode, estimated_seconds: 840 }]) }]));
    renderApp(`/writer/series/${SID}/episodes`);
    expect(await screen.findByRole("link", { name: "Arrival" })).toBeInTheDocument();
    expect(screen.getByText("14:00 / 15:00")).toBeInTheDocument();
  });

  it("edits and saves the beat plan", async () => {
    const { calls } = mockFetch(
      routes([{ method: "PUT", path: `/api/v1/studio/episodes/${EID}/plan`, respond: () => jsonResponse(episode) }]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}`);
    await userEvent.click(await screen.findByRole("button", { name: "Add beat" }));
    await userEvent.type(screen.getByLabelText("Beat 2"), "Storm hits");
    await userEvent.click(screen.getByRole("button", { name: "Move beat 2 up" }));
    await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    const body = await calls.find((c) => c.method === "PUT")!.json();
    expect(body.beats.map((b: { text: string }) => b.text)).toEqual(["Storm hits", "Ana arrives"]);
  });

  it("shows live length and speakers, and saves with the base version", async () => {
    const { calls } = mockFetch(
      routes([{ method: "POST", path: `/api/v1/studio/episodes/${EID}/drafts`, respond: () => jsonResponse(draft(3, "x"), 201) }]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/editor`);
    const editor = await screen.findByLabelText("Episode script");
    expect(editor).toHaveValue("Ana: Hello there.");
    await userEvent.clear(editor);
    await userEvent.type(editor, "Ana: One two three four.{enter}Stranger: Who?");
    expect(screen.getByText(/7 words/)).toBeInTheDocument();
    expect(screen.getByText(/Not in the bible: Stranger/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save version" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    const body = await calls.find((c) => c.method === "POST")!.json();
    expect(body).toMatchObject({ base_version: 2, text: "Ana: One two three four.\nStranger: Who?" });
  });

  it("explains a version conflict", async () => {
    mockFetch(
      routes([
        {
          method: "POST",
          path: `/api/v1/studio/episodes/${EID}/drafts`,
          respond: () => jsonResponse({ error: { code: "version_conflict", message: "newer", details: { current_version: 3 }, request_id: null } }, 409),
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/editor`);
    await userEvent.type(await screen.findByLabelText("Episode script"), " More.");
    await userEvent.click(screen.getByRole("button", { name: "Save version" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A newer version was saved since you started.");
  });

  it("compares two versions side by side", async () => {
    mockFetch(
      routes([
        { path: `/api/v1/studio/episodes/${EID}/drafts`, respond: () => jsonResponse([draft(2, "", "human"), draft(1, "", "ai")]) },
        {
          path: `/api/v1/studio/episodes/${EID}/drafts/compare`,
          respond: () => jsonResponse({ a: 1, b: 2, ops: [{ op: "replace", a_lines: ["old line"], b_lines: ["new line"] }] }),
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/history`);
    expect(await screen.findByText("AI")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Compare" }));
    const view = await screen.findByLabelText("Compare v1 and v2");
    expect(view).toHaveTextContent("old line");
    expect(view).toHaveTextContent("new line");
  });
});
