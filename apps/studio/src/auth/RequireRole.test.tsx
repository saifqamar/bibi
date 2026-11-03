import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, mockFetch, renderApp, signIn } from "@/test/render";
import { useAuth } from "./store";

describe("route guards", () => {
  beforeEach(() => useAuth.getState().clear());
  afterEach(() => vi.unstubAllGlobals());

  it("sends signed-out users to /login", () => {
    const { router } = renderApp("/writer");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("keeps writers out of the admin area", () => {
    signIn("writer");
    const { router } = renderApp("/admin");
    expect(router.state.location.pathname).toBe("/writer");
    expect(screen.queryByText("Review queue")).not.toBeInTheDocument();
  });

  it("lets admins open both areas", async () => {
    mockFetch([
      { path: "/api/v1/admin/review-queue", respond: () => jsonResponse({ items: [], total: 0, limit: 100, offset: 0 }) },
      { path: "/api/v1/studio/series", respond: () => jsonResponse({ items: [], total: 0, limit: 100, offset: 0 }) },
    ]);
    signIn("admin");
    const { router } = renderApp("/admin");
    expect(await screen.findByRole("heading", { name: "Review queue" })).toBeInTheDocument();
    await router.navigate("/writer");
    expect(await screen.findByRole("heading", { name: "My series" })).toBeInTheDocument();
  });

  it("does not let listeners into the studio", () => {
    signIn("listener");
    const { router } = renderApp("/writer");
    expect(router.state.location.pathname).toBe("/not-allowed");
  });
});
