/**
 * Guide content. Phase 1 ships placeholder copy so the layout can be reviewed;
 * phase 3 rewrites each section against the working app. Section ids are
 * stable: phase 4 maps app state (route, last action…) to them.
 */
import { linkOptions } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Callout } from "@/components/guide/callout";
import { CodeBlock } from "@/components/guide/code-block";

export interface GuideSectionContent {
  id: string;
  eyebrow: string;
  title: string;
  /** Label for the active-section chip in the mobile header. Keep it short: it's never truncated. */
  shortTitle: string;
  /**
   * The app screen this section's hands-on step happens on. Sections with one
   * get a "Try it" button on mobile that opens the app there.
   */
  tryIt?: LinkOptions;
  content: ReactNode;
}

export const GUIDE_SECTIONS: GuideSectionContent[] = [
  {
    id: "introduction",
    eyebrow: "Start here",
    title: "A notes app where every view is a query",
    shortTitle: "Intro",
    tryIt: linkOptions({ to: "/" }),
    content: (
      <>
        <p>
          Next to this guide is a small clone of Apple Notes running in a fake browser. It talks to
          a fake API, so you can slow the network down or make requests fail and see how the UI
          reacts.
        </p>
        <p>
          This guide walks you through how it's built with <strong>TanStack DB</strong>. Each
          section tells you what to do in the app and what to look for.
        </p>
        <Callout variant="tip">
          Click around first: open a folder, pick a note, open settings from the account at the
          bottom of the sidebar.
        </Callout>
      </>
    ),
  },
  {
    id: "collections",
    eyebrow: "Step 1",
    title: "What are collections?",
    shortTitle: "Collections",
    tryIt: linkOptions({ to: "/" }),
    content: (
      <>
        <p>
          A collection is a typed, in-memory set of records that stays in sync with your backend.
          The note list, the editor and the folder counts all read from the same{" "}
          <code>notesCollection</code>.
        </p>
        <CodeBlock
          filename="src/collections/notes.ts"
          code={`
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

export const notesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await fakeFetch("/api/notes");
      return response.json();
    },
    queryClient,
    getKey: (note) => note.id,
  }),
);
`}
        />
        <p>
          Because there is only one copy of each note, an edit shows up everywhere it's displayed at
          the same time.
        </p>
      </>
    ),
  },
  {
    id: "live-queries",
    eyebrow: "Step 2",
    title: "Live queries",
    shortTitle: "Live queries",
    tryIt: linkOptions({ to: "/folders/$folderId", params: { folderId: "all" } }),
    content: (
      <>
        <p>
          Each folder is a live query over notes: filter by folder, put pinned notes first, sort by
          the last edit. When a note changes, only the affected rows are recomputed.
        </p>
        <CodeBlock
          filename="src/routes/folders.$folderId.tsx"
          code={`
const { data: notes } = useLiveQuery({
  query: (q) =>
    q
      .from({ note: notesCollection })
      .where(({ note }) => eq(note.folderId, folderId))
      .orderBy(({ note }) => note.updatedAt, "desc"),
});
`}
        />
        <Callout variant="note">
          Smart folders like <code>All iCloud</code> and <code>Shared</code> aren't stored anywhere.
          They're just different <code>where</code> clauses.
        </Callout>
      </>
    ),
  },
  {
    id: "optimistic-updates",
    eyebrow: "Step 3",
    title: "Optimistic updates",
    shortTitle: "Optimistic updates",
    tryIt: linkOptions({ to: "/folders/$folderId", params: { folderId: "work" } }),
    content: (
      <>
        <p>
          Type in a note and the list updates instantly, before the server has answered. Turn the
          latency up to two seconds and try again: typing still feels instant.
        </p>
        <CodeBlock
          filename="src/components/editor.tsx"
          code={`
notesCollection.update(note.id, (draft) => {
  draft.title = title;
  draft.updatedAt = new Date().toISOString();
});
`}
        />
      </>
    ),
  },
  {
    id: "rollbacks",
    eyebrow: "Step 4",
    title: "Rollbacks",
    shortTitle: "Rollbacks",
    tryIt: linkOptions({ to: "/" }),
    content: (
      <>
        <p>
          If the server rejects a change, TanStack DB drops the optimistic state and the UI goes
          back to what the server has. Rename a folder to a name that already exists to see it.
        </p>
        <Callout variant="warning">
          Rollbacks only work if your mutation handler throws when the request fails. Check{" "}
          <code>response.ok</code>.
        </Callout>
      </>
    ),
  },
  {
    id: "sync",
    eyebrow: "Step 5",
    title: "How collections sync",
    shortTitle: "Syncing",
    content: (
      <>
        <p>
          Query collections load data with a <code>queryFn</code> and refetch after writes. Data
          flows one way: server → collection → live queries → components.
        </p>
        <ul>
          <li>Query collections: any REST or RPC API</li>
          <li>Electric and Neon Realtime: streaming sync from Postgres</li>
          <li>Local-only and localStorage collections for UI state</li>
        </ul>
      </>
    ),
  },
  {
    id: "aggregations",
    eyebrow: "Step 6",
    title: "Aggregations",
    shortTitle: "Aggregations",
    tryIt: linkOptions({ to: "/analytics" }),
    content: (
      <>
        <p>
          The analytics page groups notes by folder and counts words, all with live queries, so the
          charts move while you type.
        </p>
        <CodeBlock
          filename="src/routes/analytics.tsx"
          code={`
const { data: perFolder } = useLiveQuery({
  query: (q) =>
    q
      .from({ note: notesCollection })
      .groupBy(({ note }) => note.folderId)
      .select(({ note }) => ({
        folderId: note.folderId,
        notes: count(note.id),
      })),
});
`}
        />
      </>
    ),
  },
  {
    id: "whats-next",
    eyebrow: "Wrap-up",
    title: "What's next",
    shortTitle: "What's next",
    content: (
      <>
        <p>
          You've seen collections, live queries, optimistic updates and rollbacks. The deep dives
          cover query-driven sync and realtime sync with Neon.
        </p>
        <ul>
          <li>
            <a href="https://tanstack.com/db/latest/docs/overview" target="_blank" rel="noreferrer">
              TanStack DB docs
            </a>
          </li>
          <li>
            <a href="https://github.com/TanStack/db" target="_blank" rel="noreferrer">
              TanStack DB on GitHub
            </a>
          </li>
        </ul>
      </>
    ),
  },
];
