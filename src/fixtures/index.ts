import accountJson from "./account.json";
import foldersJson from "./folders.json";
import notesJson from "./notes.json";
import { accountSchema, folderSchema, noteSchema } from "@/db/schema";
import type { Account, Folder, Note } from "@/db/schema";

export * from "@/db/schema";

/**
 * The fixtures were written as if "now" was this moment. When seeding, every
 * timestamp is shifted by the same amount so "Today", "Yesterday" and
 * "Previous 7 Days" still make sense whenever the app is opened.
 */
export const FIXTURES_WRITTEN_AT = "2026-11-03T19:40:00.000Z";

export interface SeedData {
  folders: Folder[];
  notes: Note[];
  account: Account;
}

export function createSeedData(now: Date = new Date()): SeedData {
  const offset = now.getTime() - Date.parse(FIXTURES_WRITTEN_AT);
  const shift = (iso: string) => new Date(Date.parse(iso) + offset).toISOString();

  const folders = folderSchema.array().parse(foldersJson);
  const notes = noteSchema.array().parse(notesJson);
  const account = accountSchema.parse(accountJson);

  return {
    folders: folders.map((folder) => ({ ...folder, createdAt: shift(folder.createdAt) })),
    notes: notes.map((note) => ({
      ...note,
      createdAt: shift(note.createdAt),
      updatedAt: shift(note.updatedAt),
      deletedAt: note.deletedAt ? shift(note.deletedAt) : null,
    })),
    account: { ...account, createdAt: shift(account.createdAt) },
  };
}
