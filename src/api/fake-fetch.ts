import { createSeedData } from "@/fixtures";
import type { SeedData } from "@/fixtures";

import { createFakeServer, errorBody } from "./fake-server";
import type { NotesCommit } from "./fake-server";
import { getNetworkConfig, takeInjectedFailure } from "./network-config";
import { logRequestEnd, logRequestStart } from "./request-log";

/**
 * `fetch`, but the "network" is a function call into the in-memory server.
 * Every request waits for the configured latency, may fail on purpose, and
 * is recorded in the request log. The app only ever talks to the API
 * through this, so swapping it for `window.fetch` would be the only change
 * needed against a real backend.
 */
export async function fakeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const { pathname, search, searchParams } = new URL(url, "https://notes.example");
  const body = parseJsonBody(init.body);
  const logId = logRequestStart({ method, url: pathname + search, requestBody: body.value });

  try {
    await delay(getNetworkConfig().latencyMs, init.signal);
  } catch (error) {
    logRequestEnd(logId, {
      state: "aborted",
      status: null,
      responseBody: null,
      injectedFailure: false,
    });
    throw error;
  }

  const injectedFailure = takeInjectedFailure();
  const response = injectedFailure
    ? { status: 500, body: errorBody("injected_failure", "The server failed (on purpose).") }
    : !body.ok
      ? { status: 400, body: errorBody("invalid_json", "The request body isn't valid JSON.") }
      : server.handle({ method, path: pathname, query: searchParams, body: body.value });

  logRequestEnd(logId, {
    state: "done",
    status: response.status,
    responseBody: response.body ?? null,
    injectedFailure,
  });

  return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
    status: response.status,
    headers: response.body === undefined ? undefined : { "Content-Type": "application/json" },
  });
}

/** The request body as JSON; a body that isn't (`ok: false`) is logged as sent and gets a 400. */
function parseJsonBody(body: RequestInit["body"]): { ok: boolean; value: unknown } {
  if (body === undefined || body === null) return { ok: true, value: undefined };
  // Only JSON strings are supported; anything else (FormData, Blob…) is a bad request.
  if (typeof body !== "string") return { ok: false, value: Object.prototype.toString.call(body) };
  try {
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false, value: body };
  }
}

const commitListeners = new Set<(commit: NotesCommit) => void>();

function publishCommit(commit: NotesCommit) {
  for (const listener of commitListeners) listener(commit);
}

let server = createFakeServer(createSeedData(), { onCommit: publishCommit });

/** Starts the server over with fresh data (tests; a page reload does the same). */
export function resetFakeServer(seed: SeedData = createSeedData()) {
  server = createFakeServer(seed, { onCommit: publishCommit });
}

/**
 * The server's committed note writes, as they happen, and its notes right
 * now. Only the simulated Realtime stream uses these: the app itself talks
 * to the server through `fakeFetch` alone.
 */
export function subscribeToNoteCommits(listener: (commit: NotesCommit) => void): () => void {
  commitListeners.add(listener);
  return () => commitListeners.delete(listener);
}

export function snapshotNotes() {
  return server.notesSnapshot();
}

function delay(ms: number, signal: AbortSignal | null | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal!.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
