import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "@/routes";
import { useAuth, type Role } from "./store";

function signIn(role: Role) {
  useAuth.getState().setSession({
    user: { id: "u1", email: `${role}@bibi.test`, role },
    accessToken: "a",
    refreshToken: "r",
  });
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("route guards", () => {
  beforeEach(() => useAuth.getState().clear());

  it("sends signed-out users to /login", () => {
    const router = renderAt("/writer");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("keeps writers out of the admin area", () => {
    signIn("writer");
    const router = renderAt("/admin");
    expect(router.state.location.pathname).toBe("/writer");
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("lets admins open both areas", async () => {
    signIn("admin");
    const router = renderAt("/admin");
    expect(await screen.findByRole("heading", { name: "Admin" })).toBeInTheDocument();
    await router.navigate("/writer");
    expect(await screen.findByRole("heading", { name: "My series" })).toBeInTheDocument();
  });

  it("does not let listeners into the studio", () => {
    signIn("listener");
    const router = renderAt("/writer");
    expect(router.state.location.pathname).toBe("/not-allowed");
  });
});
