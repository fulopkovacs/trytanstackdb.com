/**
 * The guide: one section per idea, each with something to do in the app.
 * Section ids are stable: phase 4 maps app state to them (`appStates`), and
 * the dev menu, the mobile header chip and section progress refer to them.
 *
 * Code snippets come from `snippets.ts`, which quotes the app's own source.
 * Copy has to work in both layouts: the app beside the guide (wide screens)
 * and the app in a sheet opened with "Try it" (phones). Where it can't, use
 * `ByGuideLayout`.
 */
import { Link, linkOptions } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Callout } from "@/components/guide/callout";
import { SourceSnippet } from "@/components/guide/source-snippet";
import { ByGuideLayout } from "@/components/guide/try-it";
import { NOTE_TITLE_MAX_LENGTH } from "@/api/fake-server";
import type { AppActionMatcher } from "@/lib/app-actions";
import type { AppState } from "@/lib/app-state";

import { SNIPPETS } from "./snippets";

export interface GuideSectionContent {
  id: string;
  eyebrow: string;
  title: string;
  /** Label for the active-section chip in the mobile header. Keep it short: it's never truncated. */
  shortTitle: string;
  /**
   * The app states this section explains (phase 4 highlights the section
   * when the app is in one of them). Empty when no app state matches it.
   */
  appStates: AppState[];
  /**
   * The app screen this section's hands-on step happens on. Sections with one
   * get a "Try it" button on mobile that opens the app there.
   */
  tryIt?: LinkOptions;
  /**
   * The app actions that count as doing this section's hands-on step; the
   * first one that happens marks the section done (see `section-progress.ts`).
   */
  doneWhen?: AppActionMatcher[];
  content: ReactNode;
}

export const DOCS = {
  overview: "https://tanstack.com/db/latest/docs/overview",
  liveQueries: "https://tanstack.com/db/latest/docs/guides/live-queries",
  mutations: "https://tanstack.com/db/latest/docs/guides/mutations",
  concurrentTransactions:
    "https://tanstack.com/db/latest/docs/guides/mutations#concurrent-optimistic-transactions",
  queryCollection: "https://tanstack.com/db/latest/docs/collections/query-collection",
  github: "https://github.com/TanStack/db",
} as const;

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export const GUIDE_SECTIONS: GuideSectionContent[] = [
  {
    id: "introduction",
    eyebrow: "Start here",
    title: "A notes app where every view is a query",
    shortTitle: "Intro",
    appStates: [{ screen: "/" }],
    tryIt: linkOptions({ to: "/" }),
    doneWhen: [{ type: "note.opened" }],
    content: (
      <>
        <p>
          This guide comes with a small copy of Apple Notes, built with <strong>TanStack DB</strong>
          .{" "}
          <ByGuideLayout
            beside="It's in the browser window next to this guide."
            inSheet="Tap Try it under a section to open it, and close it to come back here."
          />
        </p>
        <p>
          There's no real server. The app talks to a fake API that runs in your browser: every
          request takes half a second, and some changes get rejected, like on a real backend. Each
          section tells you what to do in the app and what to look for.
        </p>
        <Callout variant="tip">
          Look around first: open a folder, pick a note, and open Settings from the account at the
          bottom of the folder list.
        </Callout>
      </>
    ),
  },
  {
    id: "collections",
    eyebrow: "Step 1",
    title: "What are collections?",
    shortTitle: "Collections",
    appStates: [
      { screen: "/folders/$folderId", lastAction: { type: "folder.opened", smart: false } },
      { screen: "/folders/$folderId/notes/$noteId", lastAction: { type: "note.opened" } },
    ],
    tryIt: linkOptions({ to: "/" }),
    doneWhen: [{ type: "folder.opened", smart: false }],
    content: (
      <>
        <p>
          A collection is a typed set of records that TanStack DB keeps in memory and in sync with
          your backend. This app has three: folders, notes and your account.
        </p>
        <p>
          Here's the notes collection. <code>queryFn</code> loads every note from the API, and{" "}
          <code>getKey</code> tells them apart. The <code>schema</code> checks the notes you create
          and change in the app, before anything is sent. (Notes loaded by <code>queryFn</code> skip
          it: this app trusts its own API.) The three handlers send your changes to the server;
          we'll get to them.
        </p>
        <SourceSnippet snippet={SNIPPETS.notesCollection} />
        <p>
          The note list, the editor and the folder counts all read from this one collection. There's
          only one copy of each note, so when it changes, every view that shows it changes with it.
        </p>
        <Callout variant="tip">
          Open a folder and edit a note's title. The note's row in the list shows the new title as
          you type (in the iPhone layout, go back to the list to see it).
        </Callout>
      </>
    ),
  },
  {
    id: "live-queries",
    eyebrow: "Step 2",
    title: "Live queries",
    shortTitle: "Live queries",
    appStates: [
      { screen: "/folders/$folderId", lastAction: { type: "folder.opened", smart: true } },
      { lastAction: { type: "note.pinned" } },
      { screen: "/settings", lastAction: { type: "account.updated" } },
    ],
    tryIt: linkOptions({ to: "/folders/$folderId", params: { folderId: "all" } }),
    doneWhen: [{ type: "folder.opened", smart: true }, { type: "note.pinned" }],
    content: (
      <>
        <p>
          You don't read a collection directly. You ask it questions with live queries, and their
          results stay up to date on their own.
        </p>
        <p>
          Each folder's list is one live query: the notes in that folder, joined with their folder's
          name, pinned notes first, then in the order picked in Settings.
        </p>
        <SourceSnippet snippet={SNIPPETS.noteListQuery} />
        <p>
          Smart folders like All iCloud, Shared and Recently Deleted aren't stored anywhere. Each
          one is just a different <code>where</code> condition:
        </p>
        <SourceSnippet snippet={SNIPPETS.inFolder} />
        <p>
          Live queries are fast because they don't run again from scratch when data changes.
          TanStack DB compiles each query into a pipeline that only processes what changed, so
          editing one note updates one row of each result, not the whole list.
        </p>
        <Callout variant="tip">
          Open All iCloud and pin a note: right-click it in the list (long-press in the iPhone
          layout) and choose Pin Note. It moves to Pinned. Then change "Sort notes by" in Settings
          and save: every list follows.
        </Callout>
      </>
    ),
  },
  {
    id: "optimistic-updates",
    eyebrow: "Step 3",
    title: "Optimistic updates",
    shortTitle: "Optimistic updates",
    appStates: [
      { screen: "/folders/$folderId/notes/$noteId", lastAction: { type: "note.edited" } },
      { lastAction: { type: "note.created" } },
      { lastAction: { type: "note.moved" } },
      { lastAction: { type: "note.deleted" } },
      { lastAction: { type: "note.restored" } },
      { lastAction: { type: "folder.renamed", status: "applied" } },
    ],
    tryIt: linkOptions({ to: "/folders/$folderId", params: { folderId: "work" } }),
    doneWhen: [{ type: "note.edited" }, { type: "folder.renamed", status: "confirmed" }],
    content: (
      <>
        <p>
          When you change something, TanStack DB shows the change straight away and sends it to the
          server in the background. That's an optimistic update: the app assumes the server will say
          yes.
        </p>
        <p>
          Renaming a folder is the simplest one. It updates the folder in its collection, and the
          collection's <code>onUpdate</code> handler sends the change to the server. The function
          returns the transaction, so a caller can wait for the server if it needs to.
        </p>
        <SourceSnippet snippet={SNIPPETS.renameFolder} />
        <p>
          Every request to the fake API takes half a second, but typing never waits for one. The
          editor doesn't send a request for each key you press, either. Changes to a note go through
          a <em>paced mutation</em>: each change shows up at once, and they're saved together when
          you pause.
        </p>
        <SourceSnippet snippet={SNIPPETS.noteChanges} />
        <h3>Why one paced mutation per note?</h3>
        <p>
          TanStack DB lets several changes be in flight at once. Each one that hasn't been saved yet
          puts its own copy of the whole note on top of what the server last sent. If a newer change
          finishes first, an older one that's still saving shows its copy again, so an old title can
          come back for a moment. That's how TanStack DB is designed, not a bug: see{" "}
          <External href={DOCS.concurrentTransactions}>concurrent optimistic transactions</External>
          .
        </p>
        <p>
          This app avoids it by sending every change to a note (typing, pinning, moving, deleting)
          through the same paced mutation, <code>changeNote</code>, built with{" "}
          <code>pacedPerRecord</code>. Its saves go out one at a time, in order, so a newer change
          never sits under an older one.
        </p>
        <Callout variant="tip">
          Type in a note: the list keeps up with every key. Then move a note to another folder from
          its right-click (or long-press) menu: both folders' counts change at once, before the
          server has answered.
        </Callout>
      </>
    ),
  },
  {
    id: "rollbacks",
    eyebrow: "Step 4",
    title: "Rollbacks",
    shortTitle: "Rollbacks",
    appStates: [{ lastAction: { status: "rolled-back" } }],
    tryIt: linkOptions({ to: "/" }),
    doneWhen: [{ status: "rolled-back" }],
    content: (
      <>
        <p>
          Sometimes the server says no. The fake API won't let two folders have the same name, just
          like a real backend would check:
        </p>
        <SourceSnippet snippet={SNIPPETS.duplicateName} />
        <p>
          By then the new name is already on screen, so TanStack DB has to undo it. It does that
          when the collection's handler throws. The handlers call the API through a small client
          that throws for any error response:
        </p>
        <SourceSnippet snippet={SNIPPETS.throwOnError} />
        <p>
          The error fails the transaction, and TanStack DB drops its optimistic changes: the folder
          gets its old name back. No component had to remember the old name.
        </p>
        <Callout variant="warning">
          <code>fetch</code> doesn't throw for 4xx or 5xx responses. If your handler doesn't check{" "}
          <code>response.ok</code> and throw, TanStack DB treats a failed save as a success.
        </Callout>
        <Callout variant="tip">
          Rename the Work folder to "Personal". In the sidebar, double-click Work or right-click it
          and choose Rename Folder. In the iPhone layout, tap Edit on the Folders screen, then tap
          Work. The new name shows up, then switches back, and a message tells you why. A note title
          longer than {NOTE_TITLE_MAX_LENGTH} characters gets rejected too.
        </Callout>
      </>
    ),
  },
  {
    id: "sync",
    eyebrow: "Step 5",
    title: "How collections sync",
    shortTitle: "Syncing",
    appStates: [{ lastAction: { status: "confirmed" } }],
    content: (
      <>
        <p>
          Data in this app flows one way: from the server into collections, from collections into
          live queries, and from live queries into components. Components never change what they
          show. They change a collection, and the change flows down from there, on top of the
          server's data until the server answers.
        </p>
        <p>
          The collections here are <em>query collections</em>, from{" "}
          <code>@tanstack/query-db-collection</code>. They load data with a TanStack Query{" "}
          <code>queryFn</code>. Saving doesn't refetch anything: each handler writes the record the
          server sent back into the collection, so the collection holds exactly what the server
          saved.
        </p>
        <SourceSnippet snippet={SNIPPETS.saveNoteUpdates} />
        <p>
          <code>inOrder</code> sends one note's requests one at a time, so an older save can't
          arrive after a newer one. <code>saveEach</code> saves every record in the transaction,
          even if one of them fails.
        </p>
        <p>
          Query collections work with any REST or RPC API. Other collection types change how data
          syncs, and keep the rest (live queries, optimistic updates, rollbacks) the same:
        </p>
        <ul>
          <li>
            Electric (<code>electricCollectionOptions</code>): real-time sync from Postgres
          </li>
          <li>PowerSync, RxDB and TrailBase, for offline-first and streaming backends</li>
          <li>
            Local-only, localStorage and IndexedDB collections, for data that stays in the browser
          </li>
        </ul>
        <Callout variant="note">
          Two deep dives go further:{" "}
          <Link to="/deep-dives/query-driven-sync">query-driven sync</Link> loads only the notes a
          query needs, and <Link to="/deep-dives/neon-realtime">Neon Realtime</Link> streams changes
          from Postgres into a collection.
        </Callout>
      </>
    ),
  },
  {
    id: "aggregations",
    eyebrow: "Step 6",
    title: "Aggregations",
    shortTitle: "Aggregations",
    appStates: [{ screen: "/analytics" }],
    tryIt: linkOptions({ to: "/analytics" }),
    content: (
      <>
        <p>
          Live queries can group and count, too. The folder counts in the sidebar come from a{" "}
          <code>groupBy</code> with <code>count</code>:
        </p>
        <SourceSnippet snippet={SNIPPETS.noteCountsQuery} />
        <p>
          The Analytics page, at the bottom of the folder list, also adds up the words in each
          folder. The query builder has no function that counts words, so a first live query works
          out each note's numbers with <code>fn.select</code>, which runs plain JavaScript:
        </p>
        <SourceSnippet snippet={SNIPPETS.noteStatsCollection} />
        <p>A live query is a collection itself, so a second query can group the first one:</p>
        <SourceSnippet snippet={SNIPPETS.folderStatsQuery} />
        <p>
          Like every live query, these update step by step. When you type in a note, only that
          note's numbers are worked out again, and only its folder's total changes.
        </p>
        <Callout variant="tip">
          Open Analytics and note a folder's word count. Add a few words to one of its notes, then
          go back to Analytics: the count has gone up.
        </Callout>
      </>
    ),
  },
  {
    id: "whats-next",
    eyebrow: "Wrap-up",
    title: "What's next",
    shortTitle: "What's next",
    appStates: [],
    content: (
      <>
        <p>
          That's the core of TanStack DB: collections hold your data, live queries read it,
          optimistic mutations change it, and rejected changes roll back on their own.
        </p>
        <h3>Deep dives</h3>
        <ul>
          <li>
            <Link to="/deep-dives/query-driven-sync">Query-driven sync</Link>: load only the notes a
            live query asks for, with <code>syncMode: "on-demand"</code>.
          </li>
          <li>
            <Link to="/deep-dives/neon-realtime">Neon Realtime</Link>: stream changes from Postgres
            into a collection.
          </li>
        </ul>
        <h3>Docs</h3>
        <ul>
          <li>
            <External href={DOCS.overview}>TanStack DB overview</External>
          </li>
          <li>
            <External href={DOCS.liveQueries}>Live queries</External>
          </li>
          <li>
            <External href={DOCS.mutations}>Mutations</External>
          </li>
          <li>
            <External href={DOCS.queryCollection}>Query collections</External>
          </li>
          <li>
            <External href={DOCS.github}>TanStack DB on GitHub</External>
          </li>
        </ul>
      </>
    ),
  },
];
