import { fakeFetch } from "./fake-fetch";
import type { ApiErrorBody } from "./fake-server";

/** A non-2xx response. Mutation handlers let it throw, which rolls the optimistic change back. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  url: string,
  { body, signal }: { body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fakeFetch(url, {
    method,
    signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // #region throw-on-error
  if (!response.ok) {
    const { error } = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, error.code, error.message);
  }
  // #endregion throw-on-error
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** JSON over `fakeFetch`. Throws an `ApiError` for any non-2xx response. */
export const api = {
  get: <T>(url: string, options?: { signal?: AbortSignal }) => request<T>("GET", url, options),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, { body }),
  patch: <T>(url: string, body: unknown, options?: { signal?: AbortSignal }) =>
    request<T>("PATCH", url, { body, ...options }),
  delete: (url: string) => request<void>("DELETE", url),
};
