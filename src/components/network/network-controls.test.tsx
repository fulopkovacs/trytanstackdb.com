import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { fakeFetch, resetFakeServer } from "@/api/fake-fetch";
import { DEFAULT_NETWORK_CONFIG, getNetworkConfig, setNetworkConfig } from "@/api/network-config";
import { clearRequestLog, requestLogStore } from "@/api/request-log";
import { subscribeToAppActions } from "@/lib/app-actions";
import type { AppActionEvent } from "@/lib/app-actions";

import { LATENCY_PRESETS } from "./latency";
import { RequestLog, setFailNextRequest, setLatency } from "./network-controls";

beforeEach(() => {
  resetFakeServer();
  clearRequestLog();
  setNetworkConfig(DEFAULT_NETWORK_CONFIG);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("network presets", () => {
  it.each(LATENCY_PRESETS)("a %i ms preset makes the fake API take that long", async (ms) => {
    vi.useFakeTimers();
    setLatency(ms);
    let settled = false;
    const request = fakeFetch("/api/account").then(() => (settled = true));
    expect(requestLogStore.get().at(-1)).toMatchObject({ state: "pending", latencyMs: ms });
    if (ms > 0) {
      await vi.advanceTimersByTimeAsync(ms - 1);
      expect(settled).toBe(false);
    }
    await vi.advanceTimersByTimeAsync(1);
    await request;
    expect(requestLogStore.get().at(-1)).toMatchObject({ state: "done", durationMs: ms });
  });

  it("fail next makes the next request fail with a 500, once", async () => {
    setLatency(0);
    setFailNextRequest(true);
    expect((await fakeFetch("/api/account")).status).toBe(500);
    expect(getNetworkConfig().failNextRequest).toBe(false);
    expect((await fakeFetch("/api/account")).status).toBe(200);
  });

  it("reports each change as an app action, so the guide can follow", () => {
    const events: AppActionEvent[] = [];
    const stop = subscribeToAppActions((event) => events.push(event));
    setLatency(5000);
    setFailNextRequest(true);
    stop();
    expect(events).toEqual([
      { type: "network.latency-set", latencyMs: 5000, status: "applied" },
      { type: "network.fail-next-set", failNext: true, status: "applied" },
    ]);
  });
});

describe("the request inspector", () => {
  const render = () => renderToStaticMarkup(<RequestLog />);

  it("says so when there are no requests yet", () => {
    expect(render()).toContain("No requests yet");
  });

  it("shows each request from the log, newest first, pending until it settles", async () => {
    vi.useFakeTimers();
    setLatency(5000);
    const save = fakeFetch("/api/folders/work", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jobs" }),
    });
    const load = fakeFetch("/api/notes");

    let html = render();
    expect(html).not.toContain("No requests yet");
    expect(html.indexOf("/api/notes")).toBeLessThan(html.indexOf("/api/folders/work"));
    expect(html.match(/data-state="pending"/g)).toHaveLength(2);
    expect(html).toContain("Pending");
    expect(html).toContain("Latency 5 s");
    // The bodies are there for when a row is expanded.
    expect(html).toContain("&quot;name&quot;: &quot;Jobs&quot;");

    await vi.advanceTimersByTimeAsync(5000);
    await Promise.all([save, load]);
    html = render();
    expect(html).not.toContain('data-state="pending"');
    expect(html.match(/>200</g)).toHaveLength(2);
    expect(html).toContain("5.0 s");
  });

  it("marks failed requests", async () => {
    setLatency(0);
    setFailNextRequest(true);
    await fakeFetch("/api/account");
    const html = render();
    expect(html).toContain(">500<");
    expect(html).toContain("Failed on purpose");
  });
});
