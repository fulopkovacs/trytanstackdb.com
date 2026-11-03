import type { Note } from "@/fixtures";

import { groupByDate } from "./dates";
import type { DateGroup } from "./dates";

export interface NoteListSections {
  pinned: Note[];
  groups: DateGroup<Note>[];
}

/** Splits a folder's notes (newest first) into the Pinned section and date groups. */
export function noteListSections(notes: Note[], now: Date): NoteListSections {
  return {
    pinned: notes.filter((note) => note.pinned),
    groups: groupByDate(
      notes.filter((note) => !note.pinned),
      (note) => new Date(note.updatedAt),
      now,
    ),
  };
}

/** Notes in the order they appear on screen: pinned first, then by date. */
export function notesInDisplayOrder(notes: Note[]): Note[] {
  return [...notes.filter((note) => note.pinned), ...notes.filter((note) => !note.pinned)];
}
