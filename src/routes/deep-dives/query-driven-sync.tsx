import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { Callout } from "@/components/guide/callout";
import { DeepDivePage } from "@/components/guide/deep-dive-page";
import { OnDemandDemo } from "@/components/guide/on-demand-demo";
import { SourceSnippet } from "@/components/guide/source-snippet";
import { SNIPPETS } from "@/guide/snippets";

export const Route = createFileRoute("/deep-dives/query-driven-sync")({
  head: () => ({ meta: [{ title: "Query-driven sync — Try TanStack DB" }] }),
  component: QueryDrivenSyncPage,
});

function QueryDrivenSyncPage() {
  return (
    <DeepDivePage
      title="Query-driven sync"
      intro={
        <p>Load only the rows your live queries ask for, instead of the whole table up front.</p>
      }
    >
      <p>
        The Notes app loads every note when it starts. That's the default,{" "}
        <code>syncMode: "eager"</code>, and it's the right choice for small tables, up to about ten
        thousand rows. For bigger ones, <code>syncMode: "on-demand"</code> loads nothing up front.
        Each live query tells the collection which rows it needs, and the collection loads just
        those.
      </p>

      <h3>The collection</h3>
      <p>
        Here's a second notes collection in on-demand mode. When a live query needs rows, its{" "}
        <code>where</code>, <code>orderBy</code> and <code>limit</code> reach <code>queryFn</code>{" "}
        as <code>meta.loadSubsetOptions</code>. <code>parseLoadSubsetOptions</code> turns the{" "}
        <code>where</code> into a flat list, like{" "}
        <code>{'[{ field: ["folderId"], operator: "eq", value: "work" }]'}</code>, and{" "}
        <code>queryFn</code> turns the parts the API understands into a URL.
      </p>
      <SourceSnippet snippet={SNIPPETS.onDemandCollection} />
      <p>
        You don't need a query key per folder: in on-demand mode, the collection adds each subset to{" "}
        <code>queryKey</code> itself, so every folder gets its own entry in the query cache.
      </p>

      <h3>The live query</h3>
      <p>A live query over that collection decides what gets loaded:</p>
      <SourceSnippet snippet={SNIPPETS.folderNotesQuery} />
      <p>
        The API can only filter by folder, so <code>isNull(note.deletedAt)</code> never reaches the
        server. That's fine: the live query still applies all of its conditions to the rows it gets.
        The server may send more rows than the query needs, never fewer.
      </p>

      <h3>Try it</h3>
      <p>
        Pick a folder. The live query asks for its notes, and the collection sends a request for
        just that folder. Going back to a folder sends its request again.
      </p>
      <ClientOnly fallback={<div className="my-5 h-48 rounded-xl border bg-muted/40" />}>
        <OnDemandDemo />
      </ClientOnly>

      <h3>Pitfalls</h3>
      <ul>
        <li>
          <strong>Return every matching row.</strong> What <code>queryFn</code> returns is the
          complete result for that subset. A row it leaves out counts as gone for that query.
        </li>
        <li>
          <strong>Know what the parser handles.</strong> <code>parseLoadSubsetOptions</code>{" "}
          understands comparisons joined with <code>and</code> (<code>eq</code>, <code>gt</code>,{" "}
          <code>gte</code>, <code>lt</code>, <code>lte</code>, <code>in</code>), null checks, and{" "}
          <code>not</code> around those. It throws for <code>or</code>, <code>like</code> and other
          functions. For those, use <code>parseWhereExpression</code> with your own handlers.
        </li>
        <li>
          <strong>Preload the query, not the collection.</strong> <code>collection.preload()</code>{" "}
          does nothing in on-demand mode. Preload the live query that needs the data instead.
        </li>
        <li>
          <strong>No initial data.</strong> <code>initialData</code> isn't supported in on-demand
          mode and throws.
        </li>
        <li>
          <strong>Custom query keys need the base prefix.</strong> If <code>queryKey</code> is a
          function, every key it returns must start with the base key, <code>queryKey({"{}"})</code>
          , or cache updates miss them.
        </li>
      </ul>
      <Callout variant="note">
        This collection is only used on this page. Its notes come from the same fake API as the
        Notes app, so edits you made there show up here.
      </Callout>
    </DeepDivePage>
  );
}
