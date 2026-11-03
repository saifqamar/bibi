import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/api";
import { useAuth } from "@/auth/store";
import { jsonResponse, mockFetch, renderApp, tokenPair } from "@/test/render";

beforeEach(() => useAuth.getState().clear());
afterEach(() => vi.unstubAllGlobals());

describe("LoginPage", () => {
  it("signs a writer in and lands on the writer area", async () => {
    const { calls } = mockFetch([
      { method: "POST", path: "/api/v1/auth/login", respond: () => jsonResponse(tokenPair("writer")) },
    ]);
    const { router } = renderApp("/login");
    await userEvent.type(screen.getByLabelText("Email"), "writer@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password-123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/writer"));
    expect(useAuth.getState().user?.role).toBe("writer");
    expect(await calls[0].json()).toEqual({ email: "writer@example.com", password: "password-123" });
  });

  it("shows the server error on bad credentials", async () => {
    mockFetch([
      {
        method: "POST",
        path: "/api/v1/auth/login",
        respond: () =>
          jsonResponse({ error: { code: "invalid_credentials", message: "Wrong email or password", details: {}, request_id: null } }, 401),
      },
    ]);
    renderApp("/login");
    await userEvent.type(screen.getByLabelText("Email"), "x@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "nope-nope");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password");
    expect(useAuth.getState().user).toBeNull();
  });
});

describe("AcceptInvitePage", () => {
  it("creates the writer account from the invite token", async () => {
    const { calls } = mockFetch([
      { method: "POST", path: "/api/v1/auth/accept-invite", respond: () => jsonResponse(tokenPair("writer")) },
    ]);
    const { router } = renderApp("/accept-invite?token=invite-token-123");
    await userEvent.type(screen.getByLabelText("Your name"), "Sara");
    await userEvent.type(screen.getByLabelText("Password"), "long-password");
    await userEvent.type(screen.getByLabelText("Confirm password"), "long-password");
    await userEvent.click(screen.getByRole("button", { name: "Accept invite" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/writer"));
    expect(await calls[0].json()).toEqual({ token: "invite-token-123", password: "long-password", display_name: "Sara" });
  });

  it("checks that passwords match before calling the API", async () => {
    const { fn } = mockFetch([]);
    renderApp("/accept-invite?token=t-123456789");
    await userEvent.type(screen.getByLabelText("Password"), "long-password");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different-pw");
    await userEvent.click(screen.getByRole("button", { name: "Accept invite" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("refreshSession", () => {
  it("rotates tokens once for concurrent callers and signs out when refresh fails", async () => {
    useAuth.getState().setSession({ user: { id: "u", email: "w@example.com", role: "writer" }, accessToken: "old", refreshToken: "r1" });
    const fetchImpl = vi.fn(async () => jsonResponse(tokenPair("writer", { access_token: "new", refresh_token: "r2" })));
    const [a, b] = await Promise.all([refreshSession(fetchImpl), refreshSession(fetchImpl)]);
    expect(a && b).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(useAuth.getState().accessToken).toBe("new");

    const failing = vi.fn(async () => jsonResponse({ error: { code: "refresh_token_reused" } }, 401));
    expect(await refreshSession(failing)).toBe(false);
    expect(useAuth.getState().user).toBeNull();
  });
});
