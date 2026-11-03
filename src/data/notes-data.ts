/**
 * Thin data-access layer for the Notes app.
 *
 * Phase 1 reads the static fixtures directly. Phase 2 swaps the internals for
 * TanStack DB collections and live queries; the hook signatures stay the same,
 * so the components don't need to change.
 */
import { useMemo } from "react";

import { createSeedData } from "@/fixtures";
import type { Account, Folder, Note } from "@/fixtures";
import {
  byUpdatedAtDesc,
  noteMatchesView,
  resolveFolderView,
  SMART_FOLDERS,
} from "@/lib/notes/folder-views";
import type { FolderView } from "@/lib/notes/folder-views";

const seed = createSeedData();

const folders = [...seed.folders].sort((a, b) => a.position - b.position);

export function useFolders(): Folder[] {
  return folders;
}

export function useFolderView(folderId: string): FolderView | undefined {
  return useMemo(() => resolveFolderView(folderId, folders), [folderId]);
}

/** Notes shown in a folder or smart folder, newest first. */
export function useNotesInFolder(folderId: string): Note[] {
  return useMemo(
    () => seed.notes.filter((note) => noteMatchesView(note, folderId)).sort(byUpdatedAtDesc),
    [folderId],
  );
}

export function useNote(noteId: string): Note | undefined {
  return useMemo(() => seed.notes.find((note) => note.id === noteId), [noteId]);
}

/**
 * A note, but only if it belongs to the folder (or smart folder) in the URL.
 * `/folders/work/notes/<a grocery list>` finds nothing, and so will a note
 * that was just moved or deleted.
 */
export function useNoteInFolder(folderId: string, noteId: string): Note | undefined {
  const note = useNote(noteId);
  return note && noteMatchesView(note, folderId) ? note : undefined;
}

/** Note count per folder id, including the smart folders. */
export function useNoteCounts(): Record<string, number> {
  return useMemo(() => {
    const ids = [...folders.map((f) => f.id), ...Object.keys(SMART_FOLDERS)];
    return Object.fromEntries(
      ids.map((id) => [id, seed.notes.filter((note) => noteMatchesView(note, id)).length]),
    );
  }, []);
}

export function useAccount(): Account {
  return seed.account;
}

export type AccountSettings = Pick<
  Account,
  "name" | "email" | "defaultFolderId" | "sortNotesBy" | "newNotesStartWith" | "groupNotesByDate"
>;

/**
 * Saves account settings. Phase 1 has no backend, so this only resolves;
 * phase 2 turns it into an optimistic update on `accountCollection`.
 */
export async function updateAccountSettings(_settings: AccountSettings): Promise<void> {}
