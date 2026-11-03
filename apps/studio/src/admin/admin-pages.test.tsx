import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, signIn } from "@/test/render";

const page = <T,>(items: T[]) => ({ items, total: items.length, limit: 100, offset: 0 });
const series = (overrides: object = {}) => ({
  id: "s1", owner_writer_id: "w1", title: "Harbour", premise: "", language: "en", tone: "", themes: [],
  target_episode_minutes: 15, status: "published", is_ai_assisted: true, free_episode_count: 1, play_count: 42,
  published_at: null, cover_url: null, created_at: "", updated_at: "", ...overrides,
});
const writer = { id: "w1", email: "ana@example.com", role: "writer", status: "active", display_name: "Ana", created_at: "", last_login_at: null };

beforeEach(() => {
  useAuth.getState().clear();
  signIn("admin");
});
afterEach(() => vi.unstubAllGlobals());

describe("admin area pages", () => {
  it("invites and deactivates writers", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/admin/writers", respond: () => jsonResponse(page([writer])) },
      { path: "/api/v1/admin/invites", respond: () => jsonResponse(page([{ id: "i1", email: "new@example.com", status: "pending", invited_by: "a", expires_at: "2026-11-10T00:00:00Z", accepted_at: null, revoked_at: null, created_at: "" }])) },
      { path: "/api/v1/admin/writer-series-counts", respond: () => jsonResponse({ w1: 3 }) },
      { method: "POST", path: "/api/v1/admin/invites", respond: () => jsonResponse({ id: "i2", email: "sara@example.com", status: "pending" }, 201) },
      { method: "POST", path: "/api/v1/admin/writers/w1/deactivate", respond: () => jsonResponse({ ...writer, status: "deactivated" }) },
      { method: "POST", path: "/api/v1/admin/invites/i1/resend", respond: () => jsonResponse({}) },
    ]);
    renderApp("/admin/writers");
    const row = (await screen.findByText("Ana")).closest("tr")!;
    expect(within(row).getByText("3")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Invite a writer"), "sara@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send invite" }));
    expect(await screen.findByText("Invite sent to sara@example.com.")).toBeInTheDocument();
    expect(await calls.find((c) => c.method === "POST" && c.url.endsWith("/admin/invites"))!.json()).toEqual({ email: "sara@example.com" });

    await userEvent.click(within(screen.getByRole("region", { name: "Pending invites" })).getByRole("button", { name: "Resend" }));
    await userEvent.click(within(row).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/w1/deactivate"))).toBe(true));
    expect(calls.some((c) => c.url.endsWith("/i1/resend"))).toBe(true);
  });

  it("sets a per-episode access override", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/studio/series/s1", respond: () => jsonResponse(series()) },
      { path: "/api/v1/admin/writers", respond: () => jsonResponse(page([writer])) },
      {
        path: "/api/v1/studio/series/s1/episodes",
        respond: () =>
          jsonResponse([
            { id: "e2", series_id: "s1", number: 2, title: "Bells", status: "published", current_version: 1, word_count: 1, estimated_seconds: 1, target_seconds: 900, is_free: null, published_at: null, plan: { beats: [], notes: "" }, created_at: "", updated_at: "" },
          ]),
      },
      { method: "PUT", path: "/api/v1/admin/episodes/e2/access", respond: () => jsonResponse({ episode_id: "e2", is_free: true }) },
    ]);
    renderApp("/admin/series/s1");
    const select = await screen.findByLabelText("Access for episode 2");
    expect(select).toHaveDisplayValue("Series default (paid)");
    await userEvent.selectOptions(select, "free");
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(await calls.find((c) => c.method === "PUT")!.json()).toEqual({ is_free: true });
  });

  it("reorders shelves and adds a series to a shelf", async () => {
    const shelves = [
      { id: "sh1", title: "Quiet nights", kind: "mood", position: 1, series_ids: [] },
      { id: "sh2", title: "Family sagas", kind: "theme", position: 2, series_ids: ["s1"] },
    ];
    const { calls } = mockFetch([
      { path: "/api/v1/admin/shelves", respond: () => jsonResponse(shelves) },
      { path: "/api/v1/admin/series", respond: () => jsonResponse(page([series(), series({ id: "s2", title: "Lanterns", status: "draft" })])) },
      { method: "PUT", path: "/api/v1/admin/shelves/order", respond: () => new Response(null, { status: 204 }) },
      { method: "PUT", path: "/api/v1/admin/shelves/sh1/items", respond: () => jsonResponse(shelves[0]) },
    ]);
    renderApp("/admin/shelves");
    await userEvent.click(await screen.findByRole("button", { name: "Move Family sagas up" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/shelves/order"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/shelves/order"))!.json()).toEqual({ shelf_ids: ["sh2", "sh1"] });

    await userEvent.selectOptions(screen.getByLabelText("Add a series to Quiet nights"), "s2");
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/sh1/items"))).toBe(true));
    expect(await calls.find((c) => c.url.endsWith("/sh1/items"))!.json()).toEqual({ series_ids: ["s2"] });
  });

  it("filters costs and the audit log", async () => {
    const { calls } = mockFetch([
      {
        path: "/api/v1/admin/costs",
        respond: () => jsonResponse({ from_date: null, to_date: null, group_by: "series", total_usd: "12.3400", rows: [{ key: "s1", label: "Harbour", cost_usd: "12.3400", input_tokens: 1000, output_tokens: 500, embedding_tokens: 0, tts_characters: 9000 }], cost_per_finished_minute_usd: null }),
      },
      {
        path: "/api/v1/admin/audit-log",
        respond: () => jsonResponse(page([{ id: "a1", actor_id: "w1", action: "series.create", entity_type: "series", entity_id: "s1", metadata: { title: "Harbour" }, created_at: "2026-11-03T10:00:00Z" }])),
      },
    ]);
    renderApp("/admin/costs");
    expect(await screen.findByLabelText("Total cost")).toHaveTextContent("$12.34");
    await userEvent.selectOptions(screen.getByLabelText("Group by"), "purpose");
    await waitFor(() => expect(calls.some((c) => c.url.includes("group_by=purpose"))).toBe(true));

    renderApp("/admin/audit");
    expect(await screen.findByText("series.create")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Entity type"), "shelf");
    await waitFor(() => expect(calls.some((c) => c.url.includes("entity_type=shelf"))).toBe(true));
  });

  it("adds a voice to the library", async () => {
    const { calls } = mockFetch([
      { path: "/api/v1/admin/voices", respond: () => jsonResponse([]) },
      { method: "POST", path: "/api/v1/admin/voices", respond: () => jsonResponse({ id: "v1" }, 201) },
    ]);
    renderApp("/admin/voices");
    await userEvent.type(await screen.findByLabelText("Voice name"), "Warm");
    await userEvent.type(screen.getByLabelText("Provider"), "acme");
    await userEvent.type(screen.getByLabelText("Provider voice id"), "warm-01");
    await userEvent.click(screen.getByRole("button", { name: "Add voice" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(await calls.find((c) => c.method === "POST")!.json()).toMatchObject({ name: "Warm", provider: "acme", provider_voice_id: "warm-01", language: "en" });
  });

  it("shows the admin navigation only to admins", async () => {
    mockFetch([{ path: "/api/v1/admin/review-queue", respond: () => jsonResponse(page([])) }]);
    renderApp("/admin");
    const nav = await screen.findByRole("navigation", { name: "Main" });
    for (const label of ["Writers", "Series", "Shelves", "Voices", "AI costs", "Audit log"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
