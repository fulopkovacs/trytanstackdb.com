import { createLiveQueryCollection } from "@tanstack/react-db";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { api } from "@/api/client";
import { setStreamDelay } from "@/api/fake-realtime";
import { setNetworkConfig } from "@/api/network-config";
import type { Note } from "@/db/schema";

import { demoNoteQuery } from "./realtime-demo";

beforeAll(() => {
  setNetworkConfig({ latencyMs: 0 });
  setStreamDelay(0);
});

describe("the Realtime demo's note", () => {
  it("is the oldest note that isn't deleted, and moves on when that one goes", async () => {
    const demoNote = createLiveQueryCollection(demoNoteQuery);
    await demoNote.preload();
    const notes = (await api.get<Note[]>("/api/notes"))
      .filter((note) => note.deletedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const [first, second] = notes as [Note, Note];
    expect(demoNote.toArray.map((note) => note.id)).toEqual([first.id]);

    // Deleted for good in the Notes app: the stream removes it, the demo picks the next one.
    await api.delete(`/api/notes/${first.id}`);
    await vi.waitFor(() => expect(demoNote.toArray.map((note) => note.id)).toEqual([second.id]));

    // Moved to Recently Deleted counts too.
    await api.patch(`/api/notes/${second.id}`, { deletedAt: new Date().toISOString() });
    await vi.waitFor(() => expect(demoNote.toArray[0]?.id).toBe(notes[2]!.id));
  });

  it("is missing once every note is gone (the demo shows an empty state)", async () => {
    const demoNote = createLiveQueryCollection(demoNoteQuery);
    await demoNote.preload();
    for (const note of await api.get<Note[]>("/api/notes"))
      await api.delete(`/api/notes/${note.id}`);
    await vi.waitFor(() => expect(demoNote.toArray).toEqual([]));
  });
});
