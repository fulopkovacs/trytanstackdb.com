import { expect, test } from "vite-plus/test";

import { createSeedData, FIXTURES_WRITTEN_AT } from "./index";

test("fixtures parse and reference existing folders", () => {
  const { folders, notes } = createSeedData();
  const folderIds = new Set(folders.map((folder) => folder.id));
  expect(notes.length).toBeGreaterThanOrEqual(20);
  expect(notes.length).toBeLessThanOrEqual(40);
  for (const note of notes) expect(folderIds.has(note.folderId)).toBe(true);
  expect(new Set(notes.map((note) => note.id)).size).toBe(notes.length);
});

test("seed timestamps are shifted relative to now", () => {
  const now = new Date(Date.parse(FIXTURES_WRITTEN_AT) + 7 * 24 * 60 * 60 * 1000);
  const shifted = createSeedData(now);
  const original = createSeedData(new Date(FIXTURES_WRITTEN_AT));
  const delta = Date.parse(shifted.notes[0]!.updatedAt) - Date.parse(original.notes[0]!.updatedAt);
  expect(delta).toBe(7 * 24 * 60 * 60 * 1000);
});
