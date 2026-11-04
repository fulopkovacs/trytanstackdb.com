import { createPacedMutations, debounceStrategy, safeRandomUUID } from "@tanstack/react-db";

import { reportMutation } from "@/lib/app-actions";
import type { AppAction } from "@/lib/app-actions";
import { editorSaveDelayMs } from "@/lib/dev-config";

import {
  accountCollection,
  foldersCollection,
  notesCollection,
  saveNoteUpdates,
} from "./collections";
import { pacedPerRecord } from "./paced-per-record";
import type { Account, Note } from "./schema";

/**
 * Every change the app makes to its data. Each one is an optimistic write to
 * a collection: it shows up everywhere immediately, the collection's handler
 * sends it to the server, and if the server rejects it, it rolls back.
 *
 * They return the transaction, so callers can wait for the server with
 * `await tx.when("settled")` (it throws if the change was rolled back).
 * Each one changes a single record, so transactions never span records.
 */

export function createNote(folderId: string) {
  const now = new Date().toISOString();
  const note: Note = {
    // Works on plain-HTTP origins too, where `crypto.randomUUID` is missing.
    id: safeRandomUUID(),
    folderId,
    title: "",
    body: "",
    pinned: false,
    shared: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const tx = notesCollection.insert(note);
  reportMutation({ type: "note.created", noteId: note.id, folderId }, tx);
  return { note, tx };
}

/** What can change on an existing note. */
export type NoteChange = Partial<
  Pick<Note, "title" | "body" | "pinned" | "folderId" | "deletedAt">
>;
export type NoteEdit = Pick<NoteChange, "title" | "body">;

// #region note-changes
/**
 * Every change to an existing note (typing, pinning, moving, deleting) goes
 * through one paced mutation per note. Each change shows up at once; they're
 * sent together, in order, when things go quiet for a moment. With a single
 * path per note, a newer change can't be hidden behind an older unsaved one.
 */
const noteChanges = pacedPerRecord((noteId) =>
  createPacedMutations<NoteChange, Note>({
    onMutate: (change) => {
      notesCollection.update(noteId, (draft) => {
        Object.assign(draft, change);
        if (change.title !== undefined || change.body !== undefined) {
          draft.updatedAt = new Date().toISOString();
        }
      });
    },
    mutationFn: ({ transaction }) => saveNoteUpdates(transaction),
    strategy: debounceStrategy({ wait: editorSaveDelayMs }),
  }),
);

function changeNote(action: AppAction, noteId: string, change: NoteChange) {
  const tx = noteChanges.mutate(noteId, change);
  reportMutation(action, tx);
  return tx;
}

/** Typing in the title or body, from any editor (or layout) that shows the note. */
export function editNote(noteId: string, edit: NoteEdit) {
  return changeNote({ type: "note.edited", noteId }, noteId, edit);
}
// #endregion note-changes

export function setNotePinned(noteId: string, pinned: boolean) {
  return changeNote({ type: "note.pinned", noteId, pinned }, noteId, { pinned });
}

/** Moves a note to another folder (out of Recently Deleted, too). */
export function moveNote(noteId: string, folderId: string) {
  return changeNote({ type: "note.moved", noteId, folderId }, noteId, {
    folderId,
    deletedAt: null,
  });
}

/** Moves a note to Recently Deleted. */
export function deleteNote(noteId: string) {
  return changeNote({ type: "note.deleted", noteId, permanently: false }, noteId, {
    deletedAt: new Date().toISOString(),
  });
}

/** Takes a note out of Recently Deleted, back into its folder. */
export function restoreNote(noteId: string) {
  return changeNote({ type: "note.restored", noteId }, noteId, { deletedAt: null });
}

/** Deletes a note for good (from Recently Deleted). */
export function deleteNotePermanently(noteId: string) {
  // The note is going away: drop its changes that haven't been sent yet.
  noteChanges.cancelPending(noteId);
  const tx = notesCollection.delete(noteId);
  reportMutation({ type: "note.deleted", noteId, permanently: true }, tx);
  return tx;
}

// #region rename-folder
export function renameFolder(folderId: string, name: string) {
  const tx = foldersCollection.update(folderId, (draft) => {
    draft.name = name;
  });
  reportMutation({ type: "folder.renamed", folderId, name }, tx);
  return tx;
}
// #endregion rename-folder

export type AccountSettings = Pick<
  Account,
  "name" | "email" | "defaultFolderId" | "sortNotesBy" | "newNotesStartWith" | "groupNotesByDate"
>;

export function updateAccount(accountId: string, settings: AccountSettings) {
  const tx = accountCollection.update(accountId, (draft) => {
    Object.assign(draft, settings);
  });
  reportMutation({ type: "account.updated" }, tx);
  return tx;
}
