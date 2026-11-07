import type { Note } from "@/db/schema";

import { groupByDate } from "./dates";
import type { DateGroup } from "./dates";

export interface NoteListSections<T extends Note> {
  pinned: T[];
  /** Date groups ("Today", "Yesterday"…), or one group without a label. */
  groups: DateGroup<T>[];
}

export interface NoteListOptions {
  /** The date the list is sorted by, or `null` when it's sorted by title. */
  dateField: "updatedAt" | "createdAt" | null;
  groupByDate: boolean;
}

/**
 * Splits a folder's notes (already sorted, pinned first) into the Pinned
 * section and date groups, the way Notes shows them.
 */
export function noteListSections<T extends Note>(
  notes: T[],
  now: Date,
  { dateField, groupByDate: grouped }: NoteListOptions,
): NoteListSections<T> {
  const pinned = notes.filter((note) => note.pinned);
  const others = notes.filter((note) => !note.pinned);
  if (!grouped || dateField === null) {
    return { pinned, groups: others.length > 0 ? [{ label: "", items: others }] : [] };
  }
  return {
    pinned,
    groups: groupByDate(others, (note) => new Date(note[dateField]), now),
  };
}
