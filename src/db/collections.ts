import { createCollection } from "@tanstack/react-db";
import type { Transaction } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { api } from "@/api/client";

import { queryClient } from "./query-client";
import { inOrder } from "./write-queue";
import { accountSchema, folderSchema, noteSchema } from "./schema";
import type { Account, Folder, Note } from "./schema";

/**
 * The app's data: three query collections over the REST API. Each one loads
 * its endpoint with `queryFn`, and its handlers send optimistic changes to the
 * server:
 *
 * - A handler that throws (a 4xx or 5xx response) rolls its change back.
 * - One that succeeds writes the server's response into the collection as
 *   confirmed data, so the collection holds exactly what the server saved.
 * - Writes to the same record go out one at a time (`inOrder`), so an older
 *   save can never land after a newer one.
 */

export const foldersCollection = createCollection(
  queryCollectionOptions({
    id: "folders",
    queryKey: ["folders"],
    queryFn: ({ signal }) => api.get<Folder[]>("/api/folders", { signal }),
    queryClient,
    schema: folderSchema,
    getKey: (folder) => folder.id,
    onUpdate: async ({ transaction, collection }) => {
      const folders = await Promise.all(
        transaction.mutations.map(({ key, changes }) => {
          const url = `/api/folders/${key}`;
          return inOrder(url, () => api.patch<Folder>(url, changes));
        }),
      );
      await collection.utils.writeUpdate(folders);
    },
  }),
);

export const notesCollection = createCollection(
  queryCollectionOptions({
    id: "notes",
    queryKey: ["notes"],
    queryFn: ({ signal }) => api.get<Note[]>("/api/notes", { signal }),
    queryClient,
    schema: noteSchema,
    getKey: (note) => note.id,
    onInsert: async ({ transaction, collection }) => {
      const notes = await Promise.all(
        transaction.mutations.map(({ key, modified }) =>
          inOrder(`/api/notes/${key}`, () => api.post<Note>("/api/notes", modified)),
        ),
      );
      await collection.utils.writeUpsert(notes);
    },
    onUpdate: ({ transaction }) => saveNoteUpdates(transaction),
    onDelete: async ({ transaction, collection }) => {
      const keys = transaction.mutations.map(({ key }) => key);
      await Promise.all(
        keys.map((key) => {
          const url = `/api/notes/${key}`;
          return inOrder(url, () => api.delete(url));
        }),
      );
      await collection.utils.writeDelete(keys);
    },
  }),
);

/**
 * Sends a transaction's note updates to the server and writes back the saved
 * notes. Also used by the editor, which batches keystrokes into one transaction.
 */
export async function saveNoteUpdates(transaction: Transaction<Note>) {
  const notes = await Promise.all(
    transaction.mutations.map(({ key, changes }) => {
      const url = `/api/notes/${key}`;
      return inOrder(url, () => api.patch<Note>(url, changes));
    }),
  );
  await notesCollection.utils.writeUpdate(notes);
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
    onUpdate: async ({ transaction, collection }) => {
      const accounts = await Promise.all(
        transaction.mutations.map(({ changes }) =>
          inOrder("/api/account", () => api.patch<Account>("/api/account", changes)),
        ),
      );
      await collection.utils.writeUpdate(accounts);
    },
  }),
);
