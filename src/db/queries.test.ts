import { createLiveQueryCollection, createTransaction } from "@tanstack/react-db";
import type { Context, InitialQueryBuilder, QueryBuilder } from "@tanstack/react-db";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { setNetworkConfig } from "@/api/network-config";

import { accountCollection, foldersCollection, notesCollection } from "./collections";
import { moveNote, renameFolder, setNotePinned } from "./mutations";
import {
  editsPerDayQuery,
  folderStatsQuery,
  noteCountQuery,
  noteCountsQuery,
  noteListQuery,
} from "./queries";

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  await Promise.all([
    foldersCollection.preload(),
    notesCollection.preload(),
    accountCollection.preload(),
  ]);
});

async function liveQuery<TContext extends Context>(
  query: (q: InitialQueryBuilder) => QueryBuilder<TContext>,
) {
  const collection = createLiveQueryCollection(query);
  await collection.preload();
  return collection;
}

describe("note list", () => {
  it("shows a folder's notes, pinned first, then newest edit first", async () => {
    const list = await liveQuery(noteListQuery("work", "dateEdited"));
    const notes = list.toArray;
    expect(notes.length).toBeGreaterThan(1);
    expect(notes.every((note) => note.folderId === "work")).toBe(true);
    const firstUnpinned = notes.findIndex((note) => !note.pinned);
    expect(notes.slice(firstUnpinned).some((note) => note.pinned)).toBe(false);
    const dates = notes.slice(firstUnpinned).map((note) => note.updatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("sorts by title, ignoring case", async () => {
    const list = await liveQuery(noteListQuery("all", "title"));
    const titles = list.toArray.filter((note) => !note.pinned).map((note) => note.title);
    expect(titles).toEqual(
      [...titles].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    );
  });

  it("joins each note with its folder's name", async () => {
    const list = await liveQuery(noteListQuery("all", "dateEdited"));
    const folderNames = new Map(
      foldersCollection.toArray.map((folder) => [folder.id, folder.name]),
    );
    for (const note of list.toArray) expect(note.folderName).toBe(folderNames.get(note.folderId));
  });

  it("smart folders are filters: Shared, and Recently Deleted", async () => {
    const shared = await liveQuery(noteListQuery("shared", "dateEdited"));
    expect(shared.toArray.length).toBeGreaterThan(0);
    expect(shared.toArray.every((note) => note.shared && note.deletedAt === null)).toBe(true);

    const deleted = await liveQuery(noteListQuery("recently-deleted", "dateEdited"));
    expect(deleted.toArray.length).toBeGreaterThan(0);
    expect(deleted.toArray.every((note) => note.deletedAt !== null)).toBe(true);
  });
});

describe("counts", () => {
  it("count notes per folder and per smart folder", async () => {
    const perFolder = await liveQuery(noteCountsQuery);
    const all = await liveQuery(noteCountQuery("all"));
    const total = perFolder.toArray.reduce((sum, row) => sum + row.count, 0);
    expect(all.toArray[0]!.count).toBe(total);
    const active = notesCollection.toArray.filter((note) => note.deletedAt === null);
    expect(total).toBe(active.length);
  });

  it("an empty folder has no count row", async () => {
    const empty = await liveQuery(noteCountQuery("no-such-folder"));
    expect(empty.toArray).toEqual([]);
  });
});

describe("optimistic changes", () => {
  it("move a note between folders everywhere at once, then stick", async () => {
    const counts = await liveQuery(noteCountsQuery);
    const travel = await liveQuery(noteListQuery("travel", "dateEdited"));
    const countOf = (folderId: string) =>
      counts.toArray.find((row) => row.folderId === folderId)?.count ?? 0;
    const workBefore = countOf("work");
    const travelBefore = countOf("travel");

    const tx = moveNote("note-01", "travel");
    // Synchronously, before the server has answered:
    expect(countOf("work")).toBe(workBefore - 1);
    expect(countOf("travel")).toBe(travelBefore + 1);
    expect(travel.toArray.map((note) => note.id)).toContain("note-01");

    await tx.when("settled");
    expect(notesCollection.get("note-01")?.folderId).toBe("travel");
    expect(countOf("travel")).toBe(travelBefore + 1);
  });

  it("pin a note to the top of its list", async () => {
    const list = await liveQuery(noteListQuery("personal", "dateEdited"));
    const last = list.toArray.at(-1)!.id;
    const tx = setNotePinned(last, true);
    expect(list.toArray[0]!.id).toBe(last);
    await tx.when("settled");
    expect(list.toArray[0]!.id).toBe(last);
  });

  it("roll back a rename the server rejects", async () => {
    const tx = renameFolder("recipes", "Personal");
    expect(foldersCollection.get("recipes")?.name).toBe("Personal");
    await expect(tx.when("settled")).rejects.toMatchObject({ status: 409 });
    expect(foldersCollection.get("recipes")?.name).toBe("Recipes");
    expect(tx.state).toBe("failed");
  });
});

describe("analytics", () => {
  it("adds up notes and words per folder", async () => {
    const perFolder = await liveQuery(folderStatsQuery);
    const active = notesCollection.toArray.filter((note) => note.deletedAt === null);
    expect(perFolder.toArray.reduce((sum, row) => sum + row.notes, 0)).toBe(active.length);

    // Notes with known word counts, in a folder of their own. Optimistic
    // only: the transaction is never committed, so nothing is sent.
    const now = new Date().toISOString();
    const note = (id: string, title: string, body: string, deletedAt: string | null = null) => ({
      id,
      folderId: "word-count-test",
      title,
      body,
      pinned: false,
      shared: false,
      createdAt: now,
      updatedAt: now,
      deletedAt,
    });
    const tx = createTransaction({ autoCommit: false, mutationFn: async () => {} });
    tx.mutate(() =>
      notesCollection.insert([
        // 2 (title) + Buy, milk, Call, Sam, Plans, Bread = 8
        note("wc-1", "Weekend shopping", "[ ] Buy milk\n[x] Call Sam\n# Plans\n- Bread"),
        // 0
        note("wc-2", "", ""),
        // Deleted: not counted at all
        note("wc-3", "Old", "gone for good", now),
      ]),
    );
    expect(perFolder.toArray.find((row) => row.folderId === "word-count-test")).toMatchObject({
      folderId: "word-count-test",
      notes: 2,
      words: 8,
    });
    tx.rollback();
  });

  it("counts notes by the day they were last edited, newest first", async () => {
    const perDay = await liveQuery(editsPerDayQuery);
    const days = perDay.toArray.map((row) => row.day);
    expect(days).toEqual([...days].sort().reverse());
    const active = notesCollection.toArray.filter((note) => note.deletedAt === null);
    expect(perDay.toArray.reduce((sum, row) => sum + row.notes, 0)).toBe(active.length);
  });

  it("updates the word count as a note changes", async () => {
    const perFolder = await liveQuery(folderStatsQuery);
    const note = notesCollection.toArray.find(
      (note) => note.folderId === "recipes" && note.deletedAt === null,
    )!;
    const before = perFolder.toArray.find((row) => row.folderId === "recipes")!.words!;
    // A transaction that's never committed: optimistic only, nothing is sent.
    const tx = createTransaction({ autoCommit: false, mutationFn: async () => {} });
    tx.mutate(() =>
      notesCollection.update(note.id, (draft) => {
        draft.body = `${draft.body} three more words`;
      }),
    );
    expect(perFolder.toArray.find((row) => row.folderId === "recipes")!.words).toBe(before + 3);
    tx.rollback();
  });
});
