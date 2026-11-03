import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn } from "@/test/render";

const totals = { plays: 4, completions: 2, next_episode_starts: 1, completion_rate: 0.5, next_episode_rate: 0.5 };

beforeEach(() => {
  useAuth.getState().clear();
  signIn("admin");
});
afterEach(() => vi.unstubAllGlobals());

describe("analytics page", () => {
  it("shows KPI tiles, the episode table and the drop-off chart", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/admin/analytics/overview", respond: () => jsonResponse({ ...totals, retention: { d1: 0.3333, d7: 0.25, d30: null } }) },
      { path: "/api/v1/admin/series", respond: () => jsonResponse({ items: [{ id: "s1", title: "Harbour" }], total: 1, limit: 100, offset: 0 }) },
      { path: "/api/v1/admin/analytics/series/s1", respond: () => jsonResponse({ ...totals, episodes: [{ episode_id: "e1", number: 1, title: "Fog", ...totals }] }) },
      {
        path: "/api/v1/admin/analytics/episodes/e1",
        respond: () => jsonResponse({ ...totals, title: "Fog", number: 1, duration_minutes: 10, dropoff: [{ minute: 2, count: 1 }, { minute: 4, count: 3 }] }),
      },
      { method: "POST", path: "/api/v1/admin/analytics/refresh", respond: () => jsonResponse({ job_id: "j" }, 202) },
    ]);
    renderApp("/admin/analytics");
    const kpis = await screen.findByRole("region", { name: "Key metrics" });
    expect(within(kpis).getByText("Completion rate").nextSibling).toHaveTextContent("50%");
    expect(within(kpis).getByText("Day-1 return").nextSibling).toHaveTextContent("33%");
    expect(within(kpis).getByText("Day-30 return").nextSibling).toHaveTextContent("—");

    await userEvent.selectOptions(screen.getByLabelText("Series"), "s1");
    await userEvent.click(await screen.findByRole("button", { name: "1. Fog" }));
    expect(await screen.findByText("Most stop in minute 5 (3 of 4).")).toBeInTheDocument();
    const bar = screen.getByRole("graphics-symbol", { name: "Minute 3: 1 stopped" });
    fireEvent.focus(bar);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Minute 3: 1 stopped (25%)");

    await userEvent.click(screen.getByRole("button", { name: "Show table" }));
    const table = screen.getByRole("table", { name: "Drop-off by minute" });
    expect(within(table).getAllByRole("row")).toHaveLength(11); // header + 10 minutes

    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/analytics/refresh"))).toBe(true));
  });
});
