import { screen, waitFor, within } from "@testing-library/react";
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
const episode = (status = "ready_for_audio") => ({
  id: EID, series_id: SID, number: 1, title: "Night", status, current_version: 2, word_count: 9,
  estimated_seconds: 4, target_seconds: 900, is_free: null, published_at: null,
  plan: { beats: [{ id: "b1", text: "x" }], notes: "" }, created_at: "", updated_at: "u",
});
const voices = [
  { id: "v1", provider: "fake", provider_voice_id: "warm", name: "Warm", language: "en", description: "", sample_text: "", is_active: true },
  { id: "v2", provider: "fake", provider_voice_id: "bright", name: "Bright", language: "en", description: "", sample_text: "", is_active: true },
];
const line = (overrides: object) => ({
  id: "l1", position: 0, kind: "dialogue", source_line: 0, speaker: "Ana", voice_id: "v2", text: "Did you hear it?",
  status: "done", duration_ms: 1200, flag: null, error: null, url: "http://media/l1.wav", ...overrides,
});

function base(extra: MockRoute[], ep = episode()): MockRoute[] {
  return [
    ...extra,
    { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
    { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
    { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse({ summary: { total_usd: "0" }, episodes: [], budget: { soft_limit_usd: null, over_budget: false } }) },
    { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(ep) },
    { path: `/api/v1/studio/episodes/${EID}/workflow-runs`, respond: () => jsonResponse([]) },
    { path: "/api/v1/studio/voices", respond: () => jsonResponse(voices) },
  ];
}

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("voices tab", () => {
  it("assigns voices and previews them", async () => {
    let previewCalls = 0;
    const { calls } = mockFetch(
      base([
        {
          path: `/api/v1/studio/series/${SID}/voice-assignments`,
          respond: () =>
            jsonResponse({
              cast: [
                { character_id: null, name: "Narrator", voice_notes: "", voice_id: "v1" },
                { character_id: "c-ana", name: "Ana", voice_notes: "young, quick", voice_id: null },
              ],
            }),
        },
        {
          method: "PUT",
          path: `/api/v1/studio/series/${SID}/voice-assignments`,
          respond: () => jsonResponse({ cast: [] }),
        },
        {
          path: "/api/v1/studio/voices/v2/preview",
          respond: () => (++previewCalls === 1 ? jsonResponse({ url: null }, 202) : jsonResponse({ url: "http://media/preview.mp3" })),
        },
      ]),
    );
    renderApp(`/writer/series/${SID}/voices`);
    expect(await screen.findByText("young, quick")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Voice for Ana"), "v2");
    const row = screen.getByText("Ana").closest("tr")!;
    await userEvent.click(within(row).getByRole("button", { name: "Preview" }));
    expect(await within(row).findByText("Preparing preview…")).toBeInTheDocument();
    expect(await within(row).findByLabelText("Voice preview", {}, { timeout: 4000 })).toHaveAttribute("src", "http://media/preview.mp3");

    await userEvent.click(screen.getByRole("button", { name: "Save voices" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(await calls.find((c) => c.method === "PUT")!.json()).toEqual({
      assignments: [
        { character_id: null, voice_id: "v1" },
        { character_id: "c-ana", voice_id: "v2" },
      ],
    });
  });
});

describe("audio tab", () => {
  const ready = {
    render: { id: "r1", draft_version: 2, status: "succeeded", workflow_run_id: "w1", lines_total: 2, lines_done: 2, error: null, created_at: "" },
    asset: { id: "a1", url: "http://media/ep.mp3", format: "mp3", duration_seconds: "962.5", loudness_lufs: "-16.0", peak_dbfs: "-12.2", created_at: "" },
    lines: [line({}), line({ id: "l2", position: 1, kind: "narration", speaker: "Stranger", voice_id: "v1", text: "Who goes there?", flag: "unknown_speaker" })],
    is_current: true,
  };

  it("shows the episode audio, flags and line tools", async () => {
    const { calls } = mockFetch(
      base([
        { path: `/api/v1/studio/episodes/${EID}/audio`, respond: () => jsonResponse(ready) },
        { method: "POST", path: "/api/v1/studio/audio-lines/l1/regenerate", respond: () => jsonResponse({ render_id: "r2", workflow_run_id: "w2" }, 202) },
        { method: "PUT", path: "/api/v1/studio/audio-lines/l2", respond: () => jsonResponse({ render_id: "r3", workflow_run_id: "w3" }, 202) },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/audio`);
    expect(await screen.findByText("16:03 · -16.0 LUFS · peak -12.2 dBFS")).toBeInTheDocument();
    expect(screen.getByLabelText("Episode audio player")).toHaveAttribute("src", "http://media/ep.mp3");
    expect(screen.getByText("Not in the bible · narrator voice")).toBeInTheDocument();

    const first = screen.getByText("Did you hear it?").closest("tr")!;
    await userEvent.click(within(first).getByRole("button", { name: "Regenerate" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/l1/regenerate"))).toBe(true));

    const second = screen.getByText("Who goes there?").closest("tr")!;
    await userEvent.click(within(second).getByRole("button", { name: "Fix text" }));
    const input = within(second).getByLabelText("Text for line 2");
    await userEvent.clear(input);
    await userEvent.type(input, "Who is there?");
    await userEvent.click(within(second).getByRole("button", { name: "Save & re-record" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(await calls.find((c) => c.method === "PUT")!.json()).toEqual({ text: "Who is there?" });
  });

  it("starts production and offers retry after a failure", async () => {
    let audio: object = { render: null, asset: null, lines: [], is_current: false };
    const { calls } = mockFetch(
      base([
        { path: `/api/v1/studio/episodes/${EID}/audio`, respond: () => jsonResponse(audio) },
        {
          method: "POST",
          path: `/api/v1/studio/episodes/${EID}/audio`,
          respond: () => {
            audio = { ...ready, asset: null, render: { ...ready.render, status: "failed", lines_done: 1, error: "1 line(s) failed: positions [1]" } };
            return jsonResponse({ render_id: "r1", workflow_run_id: "w1" }, 202);
          },
        },
        { method: "POST", path: "/api/v1/studio/audio-renders/r1/retry", respond: () => jsonResponse({ render_id: "r1", workflow_run_id: "w1" }, 202) },
      ]),
    );
    renderApp(`/writer/series/${SID}/episodes/${EID}/audio`);
    await userEvent.click(await screen.findByRole("button", { name: "Generate audio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("1 line(s) failed");
    await userEvent.click(screen.getByRole("button", { name: "Retry failed lines" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/r1/retry"))).toBe(true));
  });

  it("explains when the episode is not ready for audio", async () => {
    mockFetch(base([{ path: `/api/v1/studio/episodes/${EID}/audio`, respond: () => jsonResponse({ render: null, asset: null, lines: [], is_current: false }) }], episode("drafting")));
    renderApp(`/writer/series/${SID}/episodes/${EID}/audio`);
    expect(await screen.findByRole("button", { name: "Generate audio" })).toBeDisabled();
    expect(screen.getByText("Audio can be produced once the episode is ready for audio.")).toBeInTheDocument();
  });
});
