import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn } from "@/test/render";

const SID = "s1";
const EID = "e1";
const series = {
  id: SID, owner_writer_id: "u1", title: "Harbour", premise: "", language: "en", tone: "", themes: [],
  target_episode_minutes: 15, status: "draft", is_ai_assisted: true, free_episode_count: 1, play_count: 0,
  published_at: null, cover_url: null, created_at: "", updated_at: "",
};
const episode = {
  id: EID, series_id: SID, number: 1, title: "Arrival", status: "drafting", current_version: 1, word_count: 3,
  estimated_seconds: 1, target_seconds: 900, is_free: null, published_at: null, plan: { beats: [], notes: "" },
  created_at: "", updated_at: "",
};
const costs = (over: boolean) => ({
  summary: { total_usd: "12.500000", input_tokens: 0, output_tokens: 0, embedding_tokens: 0, tts_characters: 0, by_purpose: [] },
  episodes: [],
  budget: { soft_limit_usd: over ? "10.00" : null, over_budget: over },
});

beforeEach(() => {
  useAuth.getState().clear();
  signIn("writer");
});
afterEach(() => vi.unstubAllGlobals());

describe("AI runs and cost", () => {
  it("shows the episode cost and run history with errors", async () => {
    mockFetch([
      { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
      { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
      { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse(costs(false)) },
      { path: `/api/v1/studio/episodes/${EID}`, respond: () => jsonResponse(episode) },
      {
        path: `/api/v1/studio/episodes/${EID}/costs`,
        respond: () =>
          jsonResponse({
            total_usd: "0.084200",
            input_tokens: 12000,
            output_tokens: 3400,
            embedding_tokens: 0,
            tts_characters: 0,
            by_purpose: [{ purpose: "drafting", cost_usd: "0.084200" }],
          }),
      },
      {
        path: `/api/v1/studio/episodes/${EID}/workflow-runs`,
        respond: () =>
          jsonResponse([
            {
              id: "r1", workflow: "drafting", episode_id: EID, series_id: SID, status: "failed", current_step: "draft",
              interrupt_payload: null, error: "Provider overloaded", request_id: "req-42", started_at: null,
              finished_at: null, created_at: "2026-11-03T10:00:00Z", cost_usd: "0.0100",
            },
          ]),
      },
    ]);
    renderApp(`/writer/series/${SID}/episodes/${EID}/ai`);
    expect(await screen.findAllByText("$0.08")).toHaveLength(2); // total and the drafting row
    expect(screen.getByText("12,000")).toBeInTheDocument();
    expect(await screen.findByText("Provider overloaded")).toBeInTheDocument();
    expect(screen.getByText("Request req-42")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("warns when the series is over its budget", async () => {
    mockFetch([
      { path: `/api/v1/studio/series/${SID}`, respond: () => jsonResponse(series) },
      { path: `/api/v1/studio/series/${SID}/canon-proposals`, respond: () => jsonResponse([]) },
      { path: `/api/v1/studio/series/${SID}/costs`, respond: () => jsonResponse(costs(true)) },
    ]);
    renderApp(`/writer/series/${SID}`);
    expect(await screen.findByRole("status")).toHaveTextContent("over its budget of $10.00");
  });
});
