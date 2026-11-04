import {
  and,
  count,
  createLiveQueryCollection,
  eq,
  isNull,
  lower,
  not,
  sum,
  useLiveQuery,
} from "@tanstack/react-db";
import type { InitialQueryBuilder, Ref } from "@tanstack/react-db";
import { useEffect, useSyncExternalStore } from "react";

import { isSmartFolderId, resolveFolderView } from "@/lib/notes/folder-views";
import type { FolderView, SmartFolderId } from "@/lib/notes/folder-views";
import type { NoteListOptions } from "@/lib/notes/note-list";

import { accountCollection, foldersCollection, notesCollection } from "./collections";
import type { Account, Folder, Note, SortNotesBy } from "./schema";

/**
 * Every screen of the Notes app reads its data through these hooks, and each
 * one is a live query. When a note changes (an edit, an optimistic update, a
 * rollback, a refetch), every query that includes it updates at once: the
 * list, the editor, the folder counts and the tab title.
 */

// #region in-folder
/** Which notes a folder shows. Smart folders aren't stored anywhere: they're just filters. */
export function inFolder(note: Ref<Note>, folderId: string) {
  const notDeleted = isNull(note.deletedAt);
  switch (folderId) {
    case "all":
      return notDeleted;
    case "shared":
      return and(notDeleted, eq(note.shared, true));
    case "recently-deleted":
      return not(notDeleted);
    default:
      return and(notDeleted, eq(note.folderId, folderId));
  }
}
// #endregion in-folder

export function useFolders(): Folder[] {
  const { data: folders } = useLiveQuery({
    query: (q) =>
      q.from({ folder: foldersCollection }).orderBy(({ folder }) => folder.position, "asc"),
  });
  return folders;
}

/** A folder or smart folder by id; `undefined` once loaded means it doesn't exist. */
export function useFolderView(folderId: string): {
  view: FolderView | undefined;
  isReady: boolean;
} {
  const { data: folder, isReady } = useLiveQuery({
    query: (q) =>
      isSmartFolderId(folderId)
        ? undefined
        : q
            .from({ folder: foldersCollection })
            .where(({ folder }) => eq(folder.id, folderId))
            .findOne(),
  });
  if (isSmartFolderId(folderId)) return { view: resolveFolderView(folderId, []), isReady: true };
  return { view: folder ? resolveFolderView(folderId, [folder]) : undefined, isReady };
}

/** A note in a list, with the name of the folder it's in (cross-folder views show it). */
export type NoteListItem = Note & { folderName: string | undefined };

/** The date a sort order is about; the list groups notes by it. */
export const SORT_DATE_FIELD = {
  dateEdited: "updatedAt",
  dateCreated: "createdAt",
  title: null,
} as const satisfies Record<SortNotesBy, keyof Note | null>;

// #region note-list-query
/** A folder's notes: pinned first, then in the order picked in Settings. */
export function noteListQuery(folderId: string, sortNotesBy: SortNotesBy) {
  return (q: InitialQueryBuilder) =>
    q
      .from({ note: notesCollection })
      .leftJoin({ folder: foldersCollection }, ({ note, folder }) => eq(note.folderId, folder.id))
      .where(({ note }) => inFolder(note, folderId))
      .orderBy(({ note }) => note.pinned, "desc")
      .orderBy(
        ({ note }) =>
          sortNotesBy === "title"
            ? lower(note.title)
            : sortNotesBy === "dateCreated"
              ? note.createdAt
              : note.updatedAt,
        sortNotesBy === "title" ? "asc" : "desc",
      )
      .select(({ note, folder }) => ({ ...note, folderName: folder?.name }));
}
// #endregion note-list-query

export function useNoteList(folderId: string): {
  notes: NoteListItem[];
  isReady: boolean;
  listOptions: NoteListOptions;
} {
  const account = useAccount();
  const sortNotesBy = account?.sortNotesBy ?? "dateEdited";

  const { data: notes, isReady } = useLiveQuery({
    query: noteListQuery(folderId, sortNotesBy),
  });
  const listOptions = {
    dateField: SORT_DATE_FIELD[sortNotesBy],
    groupByDate: account?.groupNotesByDate ?? true,
  };
  return { notes, isReady, listOptions };
}

/** A note, but only if it's in the folder (or smart folder) that's open. */
export function useNoteInFolder(
  folderId: string,
  noteId: string,
): { note: Note | undefined; isReady: boolean } {
  const { data: note, isReady } = useLiveQuery({
    query: (q) =>
      q
        .from({ note: notesCollection })
        .where(({ note }) => and(eq(note.id, noteId), inFolder(note, folderId)))
        .findOne(),
  });
  return { note, isReady };
}

// #region note-counts-query
/** Notes per folder (Recently Deleted not included). */
export function noteCountsQuery(q: InitialQueryBuilder) {
  return q
    .from({ note: notesCollection })
    .where(({ note }) => isNull(note.deletedAt))
    .groupBy(({ note }) => note.folderId)
    .select(({ note }) => ({ folderId: note.folderId, count: count(note.id) }));
}
// #endregion note-counts-query

/** How many notes a (smart) folder shows: one row, or none when it's empty. */
export function noteCountQuery(folderId: string) {
  return (q: InitialQueryBuilder) =>
    q
      .from({ note: notesCollection })
      .where(({ note }) => inFolder(note, folderId))
      .select(({ note }) => ({ count: count(note.id) }));
}

/** How many notes each folder and smart folder shows, keyed by folder id. */
export function useNoteCounts(): Record<string, number> {
  const { data: perFolder } = useLiveQuery({ query: noteCountsQuery });
  const all = useSmartFolderCount("all");
  const shared = useSmartFolderCount("shared");
  const recentlyDeleted = useSmartFolderCount("recently-deleted");

  return {
    ...Object.fromEntries(perFolder.map((row) => [row.folderId, row.count])),
    all,
    shared,
    "recently-deleted": recentlyDeleted,
  };
}

function useSmartFolderCount(folderId: SmartFolderId): number {
  const { data } = useLiveQuery({ query: noteCountQuery(folderId) });
  // An aggregate over no rows has no result row.
  return data[0]?.count ?? 0;
}

/** The signed-in account (there's exactly one). */
export function useAccount(): Account | undefined {
  const { data: account } = useLiveQuery({
    query: (q) => q.from({ account: accountCollection }).findOne(),
  });
  return account;
}

/* Analytics */

/** Words in a note, title included. */
export function countWords(note: Pick<Note, "title" | "body">): number {
  return `${note.title} ${note.body}`.split(/\s+/).filter(Boolean).length;
}

/** The local calendar day of a timestamp, as `YYYY-MM-DD`. */
export function localDay(timestamp: string): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// #region note-stats-collection
/**
 * One row per note with the numbers the analytics page adds up. The query
 * builder has no "count words" function, so `fn.select` runs plain
 * JavaScript, once per note and again only when that note changes. A live
 * query is a collection too, so the queries below group this one.
 */
export const noteStatsCollection = createLiveQueryCollection((q) =>
  q
    .from({ note: notesCollection })
    .where(({ note }) => isNull(note.deletedAt))
    .fn.select(({ note }) => ({
      id: note.id,
      folderId: note.folderId,
      words: countWords(note),
      lastEditedOn: localDay(note.updatedAt),
    })),
);
// #endregion note-stats-collection

// #region folder-stats-query
/** Notes and words per folder (Recently Deleted not included). */
export function folderStatsQuery(q: InitialQueryBuilder) {
  return q
    .from({ stats: noteStatsCollection })
    .groupBy(({ stats }) => stats.folderId)
    .select(({ stats }) => ({
      folderId: stats.folderId,
      notes: count(stats.id),
      words: sum(stats.words),
    }));
}
// #endregion folder-stats-query

// #region edits-per-day-query
/** How many notes were last edited on each day, newest day first. */
export function editsPerDayQuery(q: InitialQueryBuilder) {
  return q
    .from({ stats: noteStatsCollection })
    .groupBy(({ stats }) => stats.lastEditedOn)
    .select(({ stats }) => ({ day: stats.lastEditedOn, notes: count(stats.id) }))
    .orderBy(({ $selected }) => $selected.day, "desc");
}
// #endregion edits-per-day-query

export function useFolderStats() {
  return useLiveQuery({ query: folderStatsQuery }).data;
}

export function useEditsPerDay() {
  return useLiveQuery({ query: editsPerDayQuery }).data;
}

/* Loading */

const appCollections = [foldersCollection, notesCollection, accountCollection];

export type AppDataStatus = "loading" | "ready" | "error";

function getAppDataStatus(): AppDataStatus {
  if (appCollections.some((collection) => collection.status === "error")) return "error";
  return appCollections.every((collection) => collection.isReady()) ? "ready" : "loading";
}

function subscribeToAppDataStatus(listener: () => void) {
  const unsubscribes = appCollections.map((collection) => collection.on("status:change", listener));
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

/**
 * Loads every collection and reports when all of them are ready. The Notes
 * app stays mounted for the whole visit, and so do these subscriptions: the
 * collections are never garbage-collected, so screens that come and go
 * always find their data (and your edits) in place.
 */
export function useAppData(): { status: AppDataStatus; retry: () => void } {
  useEffect(() => {
    const subscriptions = [
      foldersCollection.subscribeChanges(() => {}),
      notesCollection.subscribeChanges(() => {}),
      accountCollection.subscribeChanges(() => {}),
    ];
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, []);
  const status = useSyncExternalStore(
    subscribeToAppDataStatus,
    getAppDataStatus,
    (): AppDataStatus => "loading",
  );
  return {
    status,
    retry: () => {
      for (const collection of appCollections) void collection.utils.refetch();
    },
  };
}
