import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";

export type { components, paths };
export type Schemas = components["schemas"];

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  request_id: string | null;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current access token, if any. */
  getAccessToken?: () => string | null | undefined;
  /** Called on a 401; return true if the token was refreshed and the request should be retried. */
  onUnauthorized?: () => Promise<boolean>;
  fetch?: (input: Request) => Promise<Response>;
}

export function createApiClient(options: ApiClientOptions) {
  const baseFetch = options.fetch ?? ((input: Request) => globalThis.fetch(input));

  // Retries once after a successful token refresh.
  const fetchWithRefresh = async (input: Request): Promise<Response> => {
    const retry = input.clone();
    const response = await baseFetch(input);
    if (response.status !== 401 || !options.onUnauthorized) return response;
    if (!(await options.onUnauthorized())) return response;
    const token = options.getAccessToken?.();
    if (token) retry.headers.set("Authorization", `Bearer ${token}`);
    return baseFetch(retry);
  };

  const client = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    fetch: fetchWithRefresh,
  });

  const auth: Middleware = {
    onRequest({ request }) {
      const token = options.getAccessToken?.();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
  };
  client.use(auth);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Unwraps an openapi-fetch result, throwing ApiRequestError on error responses. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    const body = (result.error ?? {}) as { error?: ApiError };
    throw new ApiRequestError(
      result.response.status,
      body.error ?? { code: "http_error", message: result.response.statusText, details: {}, request_id: null },
    );
  }
  return result.data as T;
}
