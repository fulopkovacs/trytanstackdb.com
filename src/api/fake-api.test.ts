import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { ApiError, api } from "./client";
import { fakeFetch, resetFakeServer } from "./fake-fetch";
import { matchPath, NOTE_TITLE_MAX_LENGTH } from "./fake-server";
import {
  DEFAULT_NETWORK_CONFIG,
  getNetworkConfig,
  setNetworkConfig,
  takeInjectedFailure,
} from "./network-config";
import { clearRequestLog, REQUEST_LOG_LIMIT, requestLogStore } from "./request-log";

const json = (body: unknown) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

beforeEach(() => {
  resetFakeServer();
  clearRequestLog();
  setNetworkConfig({ ...DEFAULT_NETWORK_CONFIG, latencyMs: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("routing", () => {
  it("returns real JSON responses", async () => {
    const response = await fakeFetch("/api/folders");
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const folders = (await response.json()) as { id: string; position: number }[];
    expect(folders.map((folder) => folder.position)).toEqual(
      folders.map((folder) => folder.position).sort((a, b) => a - b),
    );
  });

  it("serves single records and the account", async () => {
    expect((await api.get<{ id: string }>("/api/notes/note-01")).id).toBe("note-01");
    expect((await api.get<{ id: string }>("/api/account")).id).toBe("account-1");
  });

  it("answers unknown paths with 404 and wrong methods with 405", async () => {
    expect((await fakeFetch("/api/nope")).status).toBe(404);
    expect((await fakeFetch("/api/notes/missing")).status).toBe(404);
    expect((await fakeFetch("/api/folders", { method: "DELETE" })).status).toBe(405);
  });

  it("filters notes by folder", async () => {
    const all = await api.get<{ folderId: string }[]>("/api/notes");
    const work = await api.get<{ folderId: string }[]>("/api/notes?folderId=work");
    expect(work.length).toBeGreaterThan(0);
    expect(work.every((note) => note.folderId === "work")).toBe(true);
    expect(work).toHaveLength(all.filter((note) => note.folderId === "work").length);
  });

  it("matches path patterns", () => {
    expect(matchPath("/api/notes/:id", "/api/notes/a%20b")).toEqual({ id: "a b" });
    expect(matchPath("/api/notes/:id", "/api/notes")).toBeNull();
    expect(matchPath("/api/notes", "/api/folders")).toBeNull();
  });
});

describe("validation", () => {
  it("rejects a folder name that's already taken (any case) with 409", async () => {
    const response = await fakeFetch("/api/folders/work", {
      method: "PATCH",
      ...json({ name: "personal" }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code: "duplicate_name", message: "There's already a folder named “personal”." },
    });
    // Nothing changed on the server.
    expect((await api.get<{ name: string }>("/api/folders/work")).name).toBe("Work");
  });

  it("rejects empty names and renaming built-in folders", async () => {
    await expect(api.patch("/api/folders/work", { name: "   " })).rejects.toMatchObject({
      status: 422,
    });
    await expect(api.patch("/api/folders/notes", { name: "Inbox" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("renames a folder, trimming the name", async () => {
    const folder = await api.patch<{ name: string }>("/api/folders/work", { name: " Job " });
    expect(folder.name).toBe("Job");
  });

  it("rejects note titles over the limit with 422", async () => {
    const error = await api
      .patch("/api/notes/note-01", { title: "x".repeat(NOTE_TITLE_MAX_LENGTH + 1) })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "title_too_long" });
  });

  it("rejects moving a note to a folder that doesn't exist", async () => {
    await expect(api.patch("/api/notes/note-01", { folderId: "nope" })).rejects.toMatchObject({
      status: 422,
    });
  });

  it("rejects an invalid email", async () => {
    await expect(api.patch("/api/account", { email: "not-an-email" })).rejects.toMatchObject({
      status: 422,
      code: "validation_failed",
    });
  });
});

describe("notes", () => {
  it("stamps updatedAt when the text changes, not when pinning", async () => {
    const before = await api.get<{ updatedAt: string }>("/api/notes/note-02");
    const pinned = await api.patch<{ updatedAt: string; pinned: boolean }>("/api/notes/note-02", {
      pinned: true,
    });
    expect(pinned).toMatchObject({ pinned: true, updatedAt: before.updatedAt });
    const edited = await api.patch<{ updatedAt: string; title: string }>("/api/notes/note-02", {
      title: "Packing list (Lisbon)",
    });
    expect(edited.title).toBe("Packing list (Lisbon)");
    expect(Date.parse(edited.updatedAt)).toBeGreaterThan(Date.parse(before.updatedAt));
  });

  it("creates and deletes notes", async () => {
    const now = new Date().toISOString();
    const note = {
      id: "new-note",
      folderId: "work",
      title: "Hello",
      body: "",
      pinned: false,
      shared: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    expect((await fakeFetch("/api/notes", { method: "POST", ...json(note) })).status).toBe(201);
    expect((await fakeFetch("/api/notes", { method: "POST", ...json(note) })).status).toBe(409);
    const deleted = await fakeFetch("/api/notes/new-note", { method: "DELETE" });
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");
    expect((await fakeFetch("/api/notes/new-note")).status).toBe(404);
  });

  it("hands out copies, so callers can't change server data", async () => {
    const note = await api.get<{ title: string }>("/api/notes/note-01");
    note.title = "Mutated";
    expect((await api.get<{ title: string }>("/api/notes/note-01")).title).not.toBe("Mutated");
  });
});

describe("latency and failure injection", () => {
  it("waits the configured latency before answering", async () => {
    vi.useFakeTimers();
    setNetworkConfig({ latencyMs: 2000 });
    let settled = false;
    const request = fakeFetch("/api/account").then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(1999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await request;
    expect(settled).toBe(true);
  });

  it("fails the next request once, without touching server data", async () => {
    setNetworkConfig({ failNextRequest: true });
    const failed = await fakeFetch("/api/folders/work", {
      method: "PATCH",
      ...json({ name: "Job" }),
    });
    expect(failed.status).toBe(500);
    expect(await failed.json()).toMatchObject({ error: { code: "injected_failure" } });
    expect(getNetworkConfig().failNextRequest).toBe(false);
    expect((await api.get<{ name: string }>("/api/folders/work")).name).toBe("Work");
  });

  it("fails the next request sent, not one already in flight", async () => {
    vi.useFakeTimers();
    setNetworkConfig({ latencyMs: 5000 });
    const inFlight = fakeFetch("/api/folders/work", { method: "PATCH", ...json({ name: "Job" }) });
    await vi.advanceTimersByTimeAsync(1000);
    // Turned on while the PATCH is pending: it doesn't apply to it.
    setNetworkConfig({ failNextRequest: true });
    await vi.advanceTimersByTimeAsync(4000);
    expect((await inFlight).status).toBe(200);
    expect(getNetworkConfig().failNextRequest).toBe(true);

    // The next request sent takes it, and still fails only after the latency.
    let settled = false;
    const next = fakeFetch("/api/account").then((response) => {
      settled = true;
      return response;
    });
    expect(getNetworkConfig().failNextRequest).toBe(false);
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await next).status).toBe(500);
    expect(requestLogStore.get().at(-1)).toMatchObject({ status: 500, injectedFailure: true });
  });

  it("fails a share of requests at random", () => {
    setNetworkConfig({ failureRate: 0.25 });
    expect(takeInjectedFailure(() => 0.1)).toBe(true);
    expect(takeInjectedFailure(() => 0.9)).toBe(false);
    setNetworkConfig({ failureRate: 0 });
    expect(takeInjectedFailure(() => 0)).toBe(false);
  });

  it("keeps fail next armed when the request that took it is aborted", async () => {
    setNetworkConfig({ latencyMs: 1000, failNextRequest: true });
    const controller = new AbortController();
    const request = fakeFetch("/api/notes", { signal: controller.signal });
    expect(getNetworkConfig().failNextRequest).toBe(false);
    controller.abort();
    await expect(request).rejects.toBeDefined();
    expect(getNetworkConfig().failNextRequest).toBe(true);
  });

  it("can be aborted while waiting", async () => {
    setNetworkConfig({ latencyMs: 1000 });
    const controller = new AbortController();
    const request = fakeFetch("/api/notes", { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toBeDefined();
    expect(requestLogStore.get().at(-1)).toMatchObject({ state: "aborted", status: null });
  });
});

describe("request log", () => {
  it("records each request while pending, then its result", async () => {
    vi.useFakeTimers();
    setNetworkConfig({ latencyMs: 500 });
    const request = fakeFetch("/api/folders/work", { method: "PATCH", ...json({ name: "Job" }) });
    expect(requestLogStore.get()).toMatchObject([
      { method: "PATCH", url: "/api/folders/work", state: "pending", requestBody: { name: "Job" } },
    ]);
    await vi.advanceTimersByTimeAsync(500);
    await request;
    const [entry] = requestLogStore.get();
    expect(entry).toMatchObject({
      state: "done",
      status: 200,
      durationMs: 500,
      injectedFailure: false,
      responseBody: { id: "work", name: "Job" },
    });
  });

  it("records malformed JSON and answers it with a 400", async () => {
    const response = await fakeFetch("/api/notes", { method: "POST", body: "{broken" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "invalid_json", message: "The request body isn't valid JSON." },
    });
    expect(requestLogStore.get()).toMatchObject([
      { method: "POST", url: "/api/notes", state: "done", status: 400, requestBody: "{broken" },
    ]);
  });

  it("marks injected failures", async () => {
    setNetworkConfig({ failNextRequest: true });
    await fakeFetch("/api/notes");
    expect(requestLogStore.get().at(-1)).toMatchObject({ status: 500, injectedFailure: true });
  });

  it("keeps only the most recent requests", async () => {
    for (let i = 0; i < REQUEST_LOG_LIMIT + 5; i++) await fakeFetch("/api/account");
    const entries = requestLogStore.get();
    expect(entries).toHaveLength(REQUEST_LOG_LIMIT);
    expect(entries[0]!.id).toBeLessThan(entries.at(-1)!.id);
  });
});
