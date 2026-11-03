import { createCollection } from "@tanstack/react-db";
import type { Transaction } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { api } from "@/api/client";

import { queryClient } from "./query-client";
import { accountSchema, folderSchema, noteSchema } from "./schema";
import type { Account, Folder, Note } from "./schema";

/**
 * The app's data: three query collections over the REST API. Each one loads
 * its endpoint with `queryFn`, and its handlers send optimistic changes to the
 * server. A handler that throws (a 4xx or 5xx response) rolls its change back;
 * one that succeeds refetches, so the collection ends up with what the server
 * actually saved.
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
      await Promise.all(
        transaction.mutations.map((mutation) =>
          api.patch(`/api/folders/${mutation.key}`, mutation.changes),
        ),
      );
      await collection.utils.refetch();
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
      await Promise.all(
        transaction.mutations.map((mutation) => api.post("/api/notes", mutation.modified)),
      );
      await collection.utils.refetch();
    },
    onUpdate: ({ transaction }) => saveNoteUpdates(transaction),
    onDelete: async ({ transaction, collection }) => {
      await Promise.all(
        transaction.mutations.map((mutation) => api.delete(`/api/notes/${mutation.key}`)),
      );
      await collection.utils.refetch();
    },
  }),
);

/**
 * Sends a transaction's note updates to the server, then refetches the notes.
 * Also used by the editor, which batches keystrokes into one transaction.
 */
export async function saveNoteUpdates(transaction: Transaction<Note>) {
  await Promise.all(
    transaction.mutations.map((mutation) =>
      api.patch(`/api/notes/${mutation.key}`, mutation.changes),
    ),
  );
  await notesCollection.utils.refetch();
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
      await Promise.all(
        transaction.mutations.map((mutation) => api.patch("/api/account", mutation.changes)),
      );
      await collection.utils.refetch();
    },
  }),
);
