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
import realtimeNotesSource from "@/db/realtime-notes.ts?raw";

import { extractCodeFence, extractRegion } from "./source-regions";
import neonReadme from "./vendor/neon-realtime-tanstack-0.1.1-README.md?raw";

/** The files snippets are quoted from, by their path in the repo. */
export const QUOTED_SOURCES = {
  "src/api/client.ts": clientSource,
  "src/api/fake-server.ts": fakeServerSource,
  "src/db/collections.ts": collectionsSource,
  "src/db/mutations.ts": mutationsSource,
  "src/db/on-demand-notes.ts": onDemandNotesSource,
  "src/db/queries.ts": queriesSource,
  "src/db/realtime-notes.ts": realtimeNotesSource,
} as const;

export type QuotedSourcePath = keyof typeof QUOTED_SOURCES;

export interface Snippet {
  /** Where the code is from, shown above it. */
  file: string;
  code: string;
}

export interface SourceRegionSnippet extends Snippet {
  file: QuotedSourcePath;
  region: string;
}

function quote(file: QuotedSourcePath, region: string): SourceRegionSnippet {
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
  realtimeNotesCollection: quote("src/db/realtime-notes.ts", "realtime-notes-collection"),
  syncRun: quote("src/db/realtime-notes.ts", "sync-run"),
  livePatchNote: quote("src/api/fake-server.ts", "live-patch-note"),
} satisfies Record<string, SourceRegionSnippet>;

/**
 * The Neon Realtime deep dive quotes the package's own README (a copy of the
 * one published with `@neon/realtime-tanstack` 0.1.1, in `vendor/`) for the
 * real API, and `db/realtime-notes.ts` for the simulation it demos: the
 * package isn't installed here (see that page).
 */
export const NEON_README_SNIPPETS = {
  collection: {
    file: "@neon/realtime-tanstack 0.1.1 · README",
    code: extractCodeFence(neonReadme, "ts", 0),
  },
  awaitTxId: {
    file: "@neon/realtime-tanstack 0.1.1 · README",
    code: extractCodeFence(neonReadme, "ts", 1),
  },
} satisfies Record<string, Snippet>;
