import { createPacedMutations, debounceStrategy, safeRandomUUID } from "@tanstack/react-db";

import { reportMutation } from "@/lib/app-actions";

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

export type NoteEdit = Partial<Pick<Note, "title" | "body">>;

/** One paced mutation per note, shared by every editor that shows it. */
const pacedNoteEdits = pacedPerRecord((noteId) =>
  createPacedMutations<NoteEdit, Note>({
    onMutate: (edit) => {
      notesCollection.update(noteId, (draft) => {
        Object.assign(draft, edit);
        draft.updatedAt = new Date().toISOString();
      });
    },
    mutationFn: ({ transaction }) => saveNoteUpdates(transaction),
    strategy: debounceStrategy({ wait: 500 }),
  }),
);

/**
 * Edits a note's title or body as you type. Every keystroke updates the note
 * right away; the changes go to the server together once typing pauses, in
 * the order they were typed, from whichever editor (or layout) they came.
 */
export function editNote(noteId: string, edit: NoteEdit) {
  const tx = pacedNoteEdits(noteId, edit);
  reportMutation({ type: "note.edited", noteId }, tx);
  return tx;
}

export function setNotePinned(noteId: string, pinned: boolean) {
  const tx = notesCollection.update(noteId, (draft) => {
    draft.pinned = pinned;
  });
  reportMutation({ type: "note.pinned", noteId, pinned }, tx);
  return tx;
}

/** Moves a note to another folder (out of Recently Deleted, too). */
export function moveNote(noteId: string, folderId: string) {
  const tx = notesCollection.update(noteId, (draft) => {
    draft.folderId = folderId;
    draft.deletedAt = null;
  });
  reportMutation({ type: "note.moved", noteId, folderId }, tx);
  return tx;
}

/** Moves a note to Recently Deleted. */
export function deleteNote(noteId: string) {
  const tx = notesCollection.update(noteId, (draft) => {
    draft.deletedAt = new Date().toISOString();
  });
  reportMutation({ type: "note.deleted", noteId, permanently: false }, tx);
  return tx;
}

/** Takes a note out of Recently Deleted, back into its folder. */
export function restoreNote(noteId: string) {
  const tx = notesCollection.update(noteId, (draft) => {
    draft.deletedAt = null;
  });
  reportMutation({ type: "note.restored", noteId }, tx);
  return tx;
}

/** Deletes a note for good (from Recently Deleted). */
export function deleteNotePermanently(noteId: string) {
  const tx = notesCollection.delete(noteId);
  reportMutation({ type: "note.deleted", noteId, permanently: true }, tx);
  return tx;
}

export function renameFolder(folderId: string, name: string) {
  const tx = foldersCollection.update(folderId, (draft) => {
    draft.name = name;
  });
  reportMutation({ type: "folder.renamed", folderId, name }, tx);
  return tx;
}

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
