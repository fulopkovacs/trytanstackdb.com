import { createStore, useStore } from "@/lib/store";

/**
 * Every call to the fake API, for the request inspector (phase 4). An entry
 * is added when the request starts (`pending`) and completed when it settles,
 * so slow requests show up while they're in flight.
 */
export interface RequestLogEntry {
  id: number;
  method: string;
  /** Path and query, e.g. `/api/notes/note-01`. */
  url: string;
  state: "pending" | "done" | "aborted";
  /** HTTP status, once there's a response. */
  status: number | null;
  /** Request body, parsed from JSON. */
  requestBody: unknown;
  /** Response body, parsed from JSON (`null` for empty responses). */
  responseBody: unknown;
  /** The failure came from failure injection, not from the server's own rules. */
  injectedFailure: boolean;
  /** Epoch milliseconds. */
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
}

/** The log keeps the most recent requests only. */
export const REQUEST_LOG_LIMIT = 200;

export const requestLogStore = createStore<readonly RequestLogEntry[]>([]);

let nextId = 1;

export function logRequestStart(
  request: Pick<RequestLogEntry, "method" | "url" | "requestBody">,
  now = Date.now(),
): number {
  const id = nextId++;
  const entry: RequestLogEntry = {
    ...request,
    id,
    state: "pending",
    status: null,
    responseBody: null,
    injectedFailure: false,
    startedAt: now,
    endedAt: null,
    durationMs: null,
  };
  requestLogStore.set((entries) => [...entries, entry].slice(-REQUEST_LOG_LIMIT));
  return id;
}

export function logRequestEnd(
  id: number,
  result: Pick<RequestLogEntry, "state" | "status" | "responseBody" | "injectedFailure">,
  now = Date.now(),
) {
  requestLogStore.set((entries) =>
    entries.map((entry) =>
      entry.id === id
        ? { ...entry, ...result, endedAt: now, durationMs: now - entry.startedAt }
        : entry,
    ),
  );
}

export function clearRequestLog() {
  requestLogStore.set([]);
}

/** Oldest first. */
export function useRequestLog(): readonly RequestLogEntry[] {
  return useStore(requestLogStore);
}
