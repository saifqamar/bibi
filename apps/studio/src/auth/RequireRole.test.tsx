import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderApp, signIn } from "@/test/render";
import { useAuth } from "./store";

describe("route guards", () => {
  beforeEach(() => useAuth.getState().clear());

  it("sends signed-out users to /login", () => {
    const { router } = renderApp("/writer");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("keeps writers out of the admin area", () => {
    signIn("writer");
    const { router } = renderApp("/admin");
    expect(router.state.location.pathname).toBe("/writer");
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("lets admins open both areas", async () => {
    signIn("admin");
    const { router } = renderApp("/admin");
    expect(await screen.findByRole("heading", { name: "Admin" })).toBeInTheDocument();
    await router.navigate("/writer");
    expect(await screen.findByRole("heading", { name: "My series" })).toBeInTheDocument();
  });

  it("does not let listeners into the studio", () => {
    signIn("listener");
    const { router } = renderApp("/writer");
    expect(router.state.location.pathname).toBe("/not-allowed");
  });
});
