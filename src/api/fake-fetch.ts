import { createSeedData } from "@/fixtures";
import type { SeedData } from "@/fixtures";

import { createFakeServer, errorBody } from "./fake-server";
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
  const { pathname, search } = new URL(url, "https://notes.example");
  const requestBody = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
  const logId = logRequestStart({ method, url: pathname + search, requestBody });

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
  const { status, body } = injectedFailure
    ? { status: 500, body: errorBody("injected_failure", "The server failed (on purpose).") }
    : server.handle({ method, path: pathname, body: requestBody });

  logRequestEnd(logId, {
    state: "done",
    status,
    responseBody: body ?? null,
    injectedFailure,
  });

  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  });
}

let server = createFakeServer(createSeedData());

/** Starts the server over with fresh data (tests; a page reload does the same). */
export function resetFakeServer(seed: SeedData = createSeedData()) {
  server = createFakeServer(seed);
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
