import { createLiveQueryCollection } from "@tanstack/react-db";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { api } from "@/api/client";
import { setNetworkConfig } from "@/api/network-config";
import { clearRequestLog, requestLogStore } from "@/api/request-log";
import type { Note } from "@/db/schema";

import { folderNotesQuery, onDemandNotesCollection } from "./on-demand-notes";

beforeAll(() => {
  setNetworkConfig({ latencyMs: 0 });
});

describe("on-demand notes", () => {
  it("loads nothing until a live query asks", () => {
    expect(onDemandNotesCollection.size).toBe(0);
  });

  it("loads one folder's notes, filtered on the server by folder", async () => {
    clearRequestLog();
    const work = createLiveQueryCollection(folderNotesQuery("work"));
    await work.preload();

    const urls = requestLogStore.get().map((entry) => entry.url);
    expect(urls).toEqual(["/api/notes?folderId=work"]);

    const serverNotes = await api.get<Note[]>("/api/notes?folderId=work");
    expect(serverNotes.some((note) => note.deletedAt !== null)).toBe(true);
    // The collection holds what the server sent for the folder, deleted notes included…
    expect(onDemandNotesCollection.toArray.map((note) => note.id).sort()).toEqual(
      serverNotes.map((note) => note.id).sort(),
    );
    // …and the live query applies the condition the API couldn't (not deleted).
    expect(work.toArray.map((note) => note.id).sort()).toEqual(
      serverNotes
        .filter((note) => note.deletedAt === null)
        .map((note) => note.id)
        .sort(),
    );
    await work.cleanup();
  });

  it("loads another folder with its own request", async () => {
    clearRequestLog();
    const recipes = createLiveQueryCollection(folderNotesQuery("recipes"));
    await recipes.preload();
    expect(requestLogStore.get().map((entry) => entry.url)).toEqual([
      "/api/notes?folderId=recipes",
    ]);
    expect(recipes.toArray.length).toBeGreaterThan(0);
    expect(recipes.toArray.every((note) => note.folderId === "recipes")).toBe(true);
    await recipes.cleanup();
  });
});
