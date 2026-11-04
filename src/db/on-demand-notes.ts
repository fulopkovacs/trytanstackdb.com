import { and, createCollection, eq, isNull } from "@tanstack/react-db";
import type { InitialQueryBuilder } from "@tanstack/react-db";
import { parseLoadSubsetOptions, queryCollectionOptions } from "@tanstack/query-db-collection";

import { api } from "@/api/client";

import { queryClient } from "./query-client";
import { noteSchema } from "./schema";
import type { Note } from "./schema";

/**
 * The query-driven sync deep dive: the same notes as `notesCollection`, but
 * loaded on demand. The Notes app itself doesn't use this collection.
 */

// #region on-demand-collection
export const onDemandNotesCollection = createCollection(
  queryCollectionOptions({
    id: "notes-on-demand",
    queryKey: ["notes-on-demand"],
    // Load nothing up front: only the notes that live queries ask for.
    syncMode: "on-demand",
    queryFn: ({ signal, meta }) => {
      // The live query's `where`, as a list of simple comparisons.
      const { filters } = parseLoadSubsetOptions(meta?.loadSubsetOptions);
      const params = new URLSearchParams();
      for (const { field, operator, value } of filters) {
        // The API can only filter by folder. Every other condition is
        // still applied by the live query, in the browser.
        if (field.join(".") === "folderId" && operator === "eq") {
          params.set("folderId", String(value));
        }
      }
      return api.get<Note[]>(`/api/notes?${params}`, { signal });
    },
    queryClient,
    schema: noteSchema,
    getKey: (note) => note.id,
  }),
);
// #endregion on-demand-collection

// #region folder-notes-query
export function folderNotesQuery(folderId: string) {
  return (q: InitialQueryBuilder) =>
    q
      .from({ note: onDemandNotesCollection })
      .where(({ note }) => and(eq(note.folderId, folderId), isNull(note.deletedAt)))
      .orderBy(({ note }) => note.updatedAt, "desc");
}
// #endregion folder-notes-query
