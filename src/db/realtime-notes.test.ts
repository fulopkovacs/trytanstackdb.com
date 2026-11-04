import { beforeAll, describe, expect, it } from "vite-plus/test";

import { api } from "@/api/client";
import { setStreamDelay, streamLogStore } from "@/api/fake-realtime";
import { setNetworkConfig } from "@/api/network-config";
import { requestLogStore } from "@/api/request-log";
import type { Note } from "@/db/schema";

import { realtimeNotesCollection } from "./realtime-notes";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  setStreamDelay(0);
  await realtimeNotesCollection.preload();
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
    expect(tx.state).toBe("persisting");

    await tx.when("settled");
    const delivered = streamLogStore
      .get()
      .some(({ message }) => message.type === "changes" && message.txid === txid);
    expect(delivered).toBe(true);
    expect(realtimeNotesCollection.get("note-02")?.title).toBe("Streamed title");
    expect((await api.get<Note>("/api/notes/note-02")).title).toBe("Streamed title");
    setStreamDelay(0);
  });

  it("also works when the stream beats the API's answer", async () => {
    setNetworkConfig({ latencyMs: 40 });
    const tx = realtimeNotesCollection.update("note-03", (draft) => {
      draft.title = "Stream first";
    });
    await tx.when("settled");
    expect(realtimeNotesCollection.get("note-03")?.title).toBe("Stream first");
    setNetworkConfig({ latencyMs: 0 });
  });

  it("rolls back a change the API rejects", async () => {
    const before = realtimeNotesCollection.get("note-04")!.title;
    const tx = realtimeNotesCollection.update("note-04", (draft) => {
      draft.title = "x".repeat(200);
    });
    await expect(tx.when("settled")).rejects.toThrow(/at most/);
    expect(realtimeNotesCollection.get("note-04")?.title).toBe(before);
  });
});
