/**
 * Every code snippet in the guide, quoted from the app's source. Each one is
 * a region of a real file (see `source-regions.ts`), read at build time with
 * Vite's `?raw` imports, so editing the code updates the guide. A snippet
 * whose region disappears fails the build's tests and throws on load.
 */
import clientSource from "@/api/client.ts?raw";
import fakeServerSource from "@/api/fake-server.ts?raw";
import collectionsSource from "@/db/collections.ts?raw";
import mutationsSource from "@/db/mutations.ts?raw";
import onDemandNotesSource from "@/db/on-demand-notes.ts?raw";
import queriesSource from "@/db/queries.ts?raw";

import { extractRegion } from "./source-regions";

/** The files snippets are quoted from, by their path in the repo. */
export const QUOTED_SOURCES = {
  "src/api/client.ts": clientSource,
  "src/api/fake-server.ts": fakeServerSource,
  "src/db/collections.ts": collectionsSource,
  "src/db/mutations.ts": mutationsSource,
  "src/db/on-demand-notes.ts": onDemandNotesSource,
  "src/db/queries.ts": queriesSource,
} as const;

export type QuotedSourcePath = keyof typeof QUOTED_SOURCES;

export interface Snippet {
  file: QuotedSourcePath;
  region: string;
  code: string;
}

function quote(file: QuotedSourcePath, region: string): Snippet {
  return { file, region, code: extractRegion(QUOTED_SOURCES[file], region) };
}

export const SNIPPETS = {
  notesCollection: quote("src/db/collections.ts", "notes-collection"),
  saveNoteUpdates: quote("src/db/collections.ts", "save-note-updates"),
  inFolder: quote("src/db/queries.ts", "in-folder"),
  noteListQuery: quote("src/db/queries.ts", "note-list-query"),
  noteCountsQuery: quote("src/db/queries.ts", "note-counts-query"),
  noteStatsCollection: quote("src/db/queries.ts", "note-stats-collection"),
  folderStatsQuery: quote("src/db/queries.ts", "folder-stats-query"),
  renameFolder: quote("src/db/mutations.ts", "rename-folder"),
  noteChanges: quote("src/db/mutations.ts", "note-changes"),
  throwOnError: quote("src/api/client.ts", "throw-on-error"),
  duplicateName: quote("src/api/fake-server.ts", "duplicate-name"),
  onDemandCollection: quote("src/db/on-demand-notes.ts", "on-demand-collection"),
  folderNotesQuery: quote("src/db/on-demand-notes.ts", "folder-notes-query"),
} satisfies Record<string, Snippet>;
