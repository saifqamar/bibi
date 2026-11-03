import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";
import { routes } from "@/routes";
import { useAuth, type Role } from "@/auth/store";

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient, ...view };
}

export function signIn(role: Role, id = "u1") {
  useAuth.getState().setSession({
    user: { id, email: `${role}@example.com`, role },
    accessToken: "access",
    refreshToken: "refresh",
  });
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export interface MockRoute {
  method?: string;
  path: string | RegExp;
  respond: (request: Request) => Response | Promise<Response>;
}

/** Endpoints every Studio page touches (the layout's notifications bell). */
const DEFAULT_ROUTES: MockRoute[] = [
  { path: "/api/v1/studio/notifications", respond: () => jsonResponse({ items: [], unread: 0 }) },
];

/** Stubs global fetch with simple method + path matching; unmatched calls fail the test. */
export function mockFetch(routes: MockRoute[]) {
  routes = [...routes, ...DEFAULT_ROUTES];
  const calls: Request[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    calls.push(request.clone());
    const url = new URL(request.url);
    const route = routes.find(
      (r) =>
        (r.method ?? "GET") === request.method &&
        (typeof r.path === "string" ? url.pathname === r.path : r.path.test(url.pathname)),
    );
    if (!route) throw new Error(`Unmocked request ${request.method} ${url.pathname}`);
    return route.respond(request);
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

export function tokenPair(role: Role, overrides: Record<string, unknown> = {}) {
  return {
    access_token: `access-${role}`,
    refresh_token: `refresh-${role}`,
    token_type: "bearer",
    expires_in: 900,
    user: {
      id: "u-" + role,
      email: `${role}@example.com`,
      role,
      status: "active",
      display_name: null,
      created_at: "2026-11-03T00:00:00Z",
    },
    ...overrides,
  };
}
