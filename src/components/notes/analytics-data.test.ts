import { createLiveQueryCollection, createTransaction } from "@tanstack/react-db";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { setNetworkConfig } from "@/api/network-config";
import { accountCollection, foldersCollection, notesCollection } from "@/db/collections";
import { editsPerDayQuery, folderStatsQuery, localDay } from "@/db/queries";

import { RECENT_DAYS, folderChartRows, recentDayRows } from "./analytics-data";

describe("folderChartRows", () => {
  it("names each folder, in order, with zero for folders without notes", () => {
    const rows = folderChartRows(
      [
        { id: "a", name: "Alpha" },
        { id: "b", name: "Beta" },
      ],
      [{ folderId: "b", notes: 2, words: 9 }],
    );
    expect(rows).toEqual([
      { folderId: "a", name: "Alpha", notes: 0, words: 0 },
      { folderId: "b", name: "Beta", notes: 2, words: 9 },
    ]);
  });
});

describe("recentDayRows", () => {
  it("lists the last days oldest first, with zeros, and counts the notes before them", () => {
    const { rows, earlier } = recentDayRows(
      [
        { day: "2026-11-04", notes: 3 },
        { day: "2026-11-01", notes: 1 },
        { day: "2026-10-01", notes: 5 },
      ],
      "2026-11-04",
      5,
    );
    expect(rows.map((row) => [row.day, row.notes])).toEqual([
      ["2026-10-31", 0],
      ["2026-11-01", 1],
      ["2026-11-02", 0],
      ["2026-11-03", 0],
      ["2026-11-04", 3],
    ]);
    expect(rows.at(-1)!.label).toBe("4 Nov");
    expect(earlier).toBe(5);
  });
});

describe("the charts' data comes from the live queries", () => {
  beforeAll(async () => {
    setNetworkConfig({ latencyMs: 0 });
    await Promise.all([
      foldersCollection.preload(),
      notesCollection.preload(),
      accountCollection.preload(),
    ]);
  });

  it("follows a note as it's edited and moved", async () => {
    const perFolder = createLiveQueryCollection(folderStatsQuery);
    const perDay = createLiveQueryCollection(editsPerDayQuery);
    await Promise.all([perFolder.preload(), perDay.preload()]);
    const chartRows = () => folderChartRows(foldersCollection.toArray, perFolder.toArray);
    const dayRows = () => recentDayRows(perDay.toArray, localDay(new Date().toISOString()));
    const rowFor = (folderId: string) => chartRows().find((row) => row.folderId === folderId)!;

    const note = notesCollection.toArray.find(
      (note) => note.folderId === "travel" && note.deletedAt === null,
    )!;
    const travel = rowFor("travel");
    const recipes = rowFor("recipes");
    const today = dayRows().rows.at(-1)!.notes;
    const total = (rows: ReturnType<typeof dayRows>) =>
      rows.rows.reduce((sum, row) => sum + row.notes, rows.earlier);
    const totalBefore = total(dayRows());

    // Optimistic only: the transaction is never committed, so nothing is sent.
    const tx = createTransaction({ autoCommit: false, mutationFn: async () => {} });
    tx.mutate(() =>
      notesCollection.update(note.id, (draft) => {
        draft.body = `${draft.body} two words`;
        draft.folderId = "recipes";
        draft.updatedAt = new Date().toISOString();
      }),
    );
    // Its words leave Travel, and arrive in Recipes with the two new ones.
    const noteWords = travel.words - rowFor("travel").words;
    expect(noteWords).toBeGreaterThan(0);
    expect(rowFor("travel").notes).toBe(travel.notes - 1);
    expect(rowFor("recipes")).toMatchObject({
      notes: recipes.notes + 1,
      words: recipes.words + noteWords + 2,
    });
    const wasToday = localDay(note.updatedAt) === localDay(new Date().toISOString());
    expect(dayRows().rows.at(-1)!.notes).toBe(wasToday ? today : today + 1);
    expect(total(dayRows())).toBe(totalBefore);

    tx.rollback();
    expect(rowFor("travel")).toEqual(travel);
    expect(dayRows().rows).toHaveLength(RECENT_DAYS);
  });
});
