import { createCollection } from "@tanstack/react-db";
import type { Transaction } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { api } from "@/api/client";

import { queryClient } from "./query-client";
import { inOrder, saveEach } from "./write-queue";
import { accountSchema, folderSchema, noteSchema } from "./schema";
import type { Account, Folder, Note } from "./schema";

/**
 * The app's data: three query collections over the REST API. Each one loads
 * its endpoint with `queryFn`, and its handlers send optimistic changes to the
 * server, one record at a time:
 *
 * - The server's response is written into the collection as confirmed data,
 *   so the collection holds exactly what the server saved.
 * - A rejected request (4xx or 5xx) makes the handler throw, which rolls the
 *   transaction's optimistic changes back.
 * - `inOrder` keeps each record's request and write-back in order, so an
 *   older save can never land after a newer one.
 */

// #region folders-collection
export const foldersCollection = createCollection(
  queryCollectionOptions({
    id: "folders",
    queryKey: ["folders"],
    queryFn: ({ signal }) => api.get<Folder[]>("/api/folders", { signal }),
    queryClient,
    schema: folderSchema,
    getKey: (folder) => folder.id,
    onUpdate: ({ transaction, collection }) =>
      saveEach(transaction.mutations, ({ key, changes }) =>
        inOrder(`/api/folders/${key}`, async () => {
          const folder = await api.patch<Folder>(`/api/folders/${key}`, changes);
          await collection.utils.writeUpdate(folder);
        }),
      ),
  }),
);
// #endregion folders-collection

// #region notes-collection
export const notesCollection = createCollection(
  queryCollectionOptions({
    id: "notes",
    queryKey: ["notes"],
    queryFn: ({ signal }) => api.get<Note[]>("/api/notes", { signal }),
    queryClient,
    schema: noteSchema,
    getKey: (note) => note.id,
    onInsert: ({ transaction }) => saveNewNotes(transaction),
    onUpdate: ({ transaction }) => saveNoteUpdates(transaction),
    onDelete: ({ transaction }) => deleteNotes(transaction),
  }),
);
// #endregion notes-collection

function saveNewNotes(transaction: Transaction<Note>) {
  return saveEach(transaction.mutations, ({ key, modified }) =>
    inOrder(`/api/notes/${key}`, async () => {
      const note = await api.post<Note>("/api/notes", modified);
      await notesCollection.utils.writeUpsert(note);
    }),
  );
}

// #region save-note-updates
/**
 * Sends a transaction's note updates and writes back the saved notes. Also
 * the save step of the paced mutation every note change goes through
 * (`changeNote` in `mutations.ts`).
 */
export function saveNoteUpdates(transaction: Transaction<Note>) {
  return saveEach(transaction.mutations, ({ key, changes }) =>
    inOrder(`/api/notes/${key}`, async () => {
      const note = await api.patch<Note>(`/api/notes/${key}`, changes);
      await notesCollection.utils.writeUpdate(note);
    }),
  );
}
// #endregion save-note-updates

function deleteNotes(transaction: Transaction<Note>) {
  return saveEach(transaction.mutations, ({ key }) =>
    inOrder(`/api/notes/${key}`, async () => {
      await api.delete(`/api/notes/${key}`);
      await notesCollection.utils.writeDelete(key);
    }),
  );
}

export const accountCollection = createCollection(
  queryCollectionOptions({
    id: "account",
    queryKey: ["account"],
    // One signed-in account: the collection holds a single row.
    queryFn: async ({ signal }) => [await api.get<Account>("/api/account", { signal })],
    queryClient,
    schema: accountSchema,
    getKey: (account) => account.id,
    onUpdate: ({ transaction, collection }) =>
      saveEach(transaction.mutations, ({ changes }) =>
        inOrder("/api/account", async () => {
          const account = await api.patch<Account>("/api/account", changes);
          await collection.utils.writeUpdate(account);
        }),
      ),
  }),
);
