import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { api } from "@/api/client";
import { setStreamDelay, streamLogStore } from "@/api/fake-realtime";
import { setNetworkConfig } from "@/api/network-config";
import { requestLogStore } from "@/api/request-log";
import type { Note } from "@/db/schema";

import { createSyncRun, realtimeNotesCollection } from "./realtime-notes";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const streamDelivered = (txid: string) =>
  streamLogStore.get().some(({ message }) => message.type === "changes" && message.txid === txid);

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  setStreamDelay(0);
  await realtimeNotesCollection.preload();
});

afterEach(() => {
  vi.restoreAllMocks();
  setNetworkConfig({ latencyMs: 0 });
  setStreamDelay(0);
});

describe("simulated Neon Realtime collection", () => {
  it("starts from the stream's complete result", async () => {
    const notes = await api.get<Note[]>("/api/notes");
    expect(realtimeNotesCollection.size).toBe(notes.length);
  });

  it("keeps an edit optimistic until its txid comes through the stream", async () => {
    setStreamDelay(80);
    const tx = realtimeNotesCollection.update("note-02", (draft) => {
      draft.title = "Streamed title";
    });
    expect(realtimeNotesCollection.get("note-02")?.title).toBe("Streamed title");

    // The API has answered with a txid, but the stream hasn't delivered it.
    await sleep(30);
    const patch = requestLogStore.get().find((entry) => entry.url === "/api/live/notes/note-02");
    const { txid } = patch!.responseBody as { txid: string };
    expect(txid).toMatch(/^\d+$/);
    expect(streamDelivered(txid)).toBe(false);
    expect(tx.state).toBe("persisting");

    await tx.when("settled");
    expect(streamDelivered(txid)).toBe(true);
    expect(realtimeNotesCollection.get("note-02")?.title).toBe("Streamed title");
    expect((await api.get<Note>("/api/notes/note-02")).title).toBe("Streamed title");
  });

  it("also works when the stream beats the API's answer", async () => {
    // Hold the API's answer back after the server has committed the change.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const committed: string[] = [];
    const patch = api.patch;
    vi.spyOn(api, "patch").mockImplementation(async <T>(url: string, body: unknown) => {
      const result = await patch<T>(url, body);
      committed.push((result as { txid: string }).txid);
      await gate;
      return result;
    });

    const tx = realtimeNotesCollection.update("note-03", (draft) => {
      draft.title = "Stream first";
    });
    await vi.waitFor(() => expect(committed).toHaveLength(1));
    const [txid] = committed as [string];
    await vi.waitFor(() => expect(streamDelivered(txid)).toBe(true));
    // The stream has delivered the change; the handler hasn't heard back yet.
    expect(tx.state).toBe("persisting");

    release();
    await tx.when("settled");
    expect(tx.state).toBe("completed");
    expect(realtimeNotesCollection.get("note-03")?.title).toBe("Stream first");
  });

  it("saves a note's changes one at a time, so the newest one wins", async () => {
    setNetworkConfig({ latencyMs: 80 });
    const a = realtimeNotesCollection.update("note-05", (draft) => {
      draft.title = "Rename A";
    });
    setNetworkConfig({ latencyMs: 0 });
    const b = realtimeNotesCollection.update("note-05", (draft) => {
      draft.title = "Rename B";
    });
    expect(realtimeNotesCollection.get("note-05")?.title).toBe("Rename B");

    await Promise.all([a.when("settled"), b.when("settled")]);
    expect((await api.get<Note>("/api/notes/note-05")).title).toBe("Rename B");
    expect(realtimeNotesCollection.get("note-05")?.title).toBe("Rename B");
  });

  it("rolls back a change the API rejects", async () => {
    const before = realtimeNotesCollection.get("note-04")!.title;
    const tx = realtimeNotesCollection.update("note-04", (draft) => {
      draft.title = "x".repeat(200);
    });
    await expect(tx.when("settled")).rejects.toThrow(/at most/);
    expect(realtimeNotesCollection.get("note-04")?.title).toBe(before);
  });

  it("fails writes still waiting for the stream when it's cleaned up, and starts over", async () => {
    setStreamDelay(200);
    const tx = realtimeNotesCollection.update("note-06", (draft) => {
      draft.title = "Never streamed";
    });
    // The API has answered; the stream message is still on its way.
    await vi.waitFor(() =>
      expect(
        requestLogStore
          .get()
          .some((entry) => entry.url === "/api/live/notes/note-06" && entry.state === "done"),
      ).toBe(true),
    );
    const waiting = realtimeNotesCollection.utils.awaitTxId("999999");

    await realtimeNotesCollection.cleanup();
    await expect(tx.when("settled")).rejects.toThrow(/cleaned up/);
    await expect(waiting).rejects.toThrow(/cleaned up/);
    await expect(realtimeNotesCollection.utils.awaitTxId("1")).rejects.toThrow(/isn't syncing/);

    // A new sync run starts from the server's current rows.
    setStreamDelay(0);
    await realtimeNotesCollection.preload();
    expect(realtimeNotesCollection.get("note-06")?.title).toBe("Never streamed");
  });
  it("abandons a write when its sync run is cleaned up, without blocking the next one", async () => {
    // The server commits rename A, but its answer is held back.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let hold = true;
    const patch = api.patch;
    const spy = vi.spyOn(api, "patch").mockImplementation((async (
      ...args: Parameters<typeof api.patch>
    ) => {
      const result = await patch(...args);
      if (hold) {
        hold = false;
        await gate;
      }
      return result;
    }) as typeof api.patch);

    const a = realtimeNotesCollection.update("note-09", (draft) => {
      draft.title = "Abandoned A";
    });
    await vi.waitFor(async () =>
      expect((await api.get<Note>("/api/notes/note-09")).title).toBe("Abandoned A"),
    );

    await realtimeNotesCollection.cleanup();
    await expect(a.when("settled")).rejects.toThrow(/cleaned up/);

    await realtimeNotesCollection.preload();
    const b = realtimeNotesCollection.update("note-09", (draft) => {
      draft.title = "Written B";
    });
    await b.when("settled");
    expect(spy).toHaveBeenCalledTimes(2);

    // A's late answer changes nothing.
    release();
    await sleep(10);
    expect(a.state).toBe("failed");
    expect(b.state).toBe("completed");
    expect((await api.get<Note>("/api/notes/note-09")).title).toBe("Written B");
    expect(realtimeNotesCollection.get("note-09")?.title).toBe("Written B");
  });

  it("delivers transactions in commit order, even when the stream delay changes", async () => {
    setStreamDelay(250);
    const a = realtimeNotesCollection.update("note-07", (draft) => {
      draft.title = "late stream A";
    });
    await vi.waitFor(() =>
      expect(
        requestLogStore
          .get()
          .some((entry) => entry.url === "/api/live/notes/note-07" && entry.state === "done"),
      ).toBe(true),
    );
    const { txid: txidA } = requestLogStore
      .get()
      .filter((entry) => entry.url === "/api/live/notes/note-07")
      .at(-1)!.responseBody as {
      txid: string;
    };
    let deliveredWhenASettled: boolean | undefined;
    const aSettled = a.when("settled").then(() => {
      deliveredWhenASettled = streamDelivered(txidA);
    });

    setStreamDelay(0);
    const b = realtimeNotesCollection.update("note-08", (draft) => {
      draft.title = "quick stream B";
    });
    await Promise.all([aSettled, b.when("settled")]);

    // A can't be confirmed before its own batch arrives.
    expect(deliveredWhenASettled).toBe(true);
    const order = streamLogStore
      .get()
      .flatMap(({ message }) => (message.type === "changes" ? [message.txid] : []));
    const txidB = String(Number(txidA) + 1);
    expect(order.indexOf(txidA)).toBeGreaterThanOrEqual(0);
    expect(order.indexOf(txidA)).toBeLessThan(order.indexOf(txidB));
    expect(realtimeNotesCollection.get("note-07")?.title).toBe("late stream A");
  });
  it("leaves no unhandled rejection when cleaned up right after a change", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      const tx = realtimeNotesCollection.update("note-10", (draft) => {
        draft.title = "Cleaned up at once";
      });
      const settled = tx.when("settled").catch((error: unknown) => error);
      await realtimeNotesCollection.cleanup();
      expect(await settled).toBeInstanceOf(Error);
      await sleep(20);
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandled);
      await realtimeNotesCollection.preload();
    }
  });
});

describe("sync run", () => {
  it("resolves waits up to the last delivered txid, before or after delivery", async () => {
    const tracker = createSyncRun();
    const later = tracker.wait("1005");
    tracker.seen("1004");
    expect(tracker.waiting).toBe(1);
    tracker.seen("1005");
    await expect(later).resolves.toBe(true);
    // Already delivered (including older ids): resolves at once.
    await expect(tracker.wait("1003")).resolves.toBe(true);
    expect(tracker.waiting).toBe(0);
  });

  it("drops a wait that times out", async () => {
    const tracker = createSyncRun();
    await expect(tracker.wait("2000", 10)).rejects.toThrow(/Timed out/);
    expect(tracker.waiting).toBe(0);
  });

  it("rejects every wait when closed", async () => {
    vi.useFakeTimers();
    const tracker = createSyncRun();
    const waits = [tracker.wait("1"), tracker.wait("2", 60_000)];
    tracker.close(new Error("cleaned up"));
    await expect(Promise.all(waits)).rejects.toThrow("cleaned up");
    expect(tracker.waiting).toBe(0);
    // The timeout's timer was cleared too.
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
  it("removes its abort listener once a request settles, either way", async () => {
    const run = createSyncRun();
    const added = vi.spyOn(run.signal, "addEventListener");
    const removed = vi.spyOn(run.signal, "removeEventListener");
    const ok = Array.from({ length: 20 }, () => run.during(() => Promise.resolve("ok")));
    const failed = Array.from({ length: 5 }, () =>
      run.during(() => Promise.reject(new Error("nope"))).catch(() => "failed"),
    );
    await Promise.all([...ok, ...failed]);
    expect(added).toHaveBeenCalledTimes(25);
    expect(removed).toHaveBeenCalledTimes(25);
    for (const [index, call] of added.mock.calls.entries()) {
      expect(removed.mock.calls[index]?.[1]).toBe(call[1]);
    }
  });

  it("doesn't start a request once the run has ended", async () => {
    const run = createSyncRun();
    run.close(new Error("cleaned up"));
    const start = vi.fn(() => Promise.resolve("never"));
    await expect(run.during(start)).rejects.toThrow("cleaned up");
    expect(start).not.toHaveBeenCalled();
  });
});
