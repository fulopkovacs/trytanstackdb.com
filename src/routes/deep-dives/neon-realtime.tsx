import { createFileRoute } from "@tanstack/react-router";

import { Callout } from "@/components/guide/callout";
import { DeepDivePage } from "@/components/guide/deep-dive-page";
import { SourceSnippet } from "@/components/guide/source-snippet";
import { NEON_README_SNIPPETS } from "@/guide/snippets";

export const Route = createFileRoute("/deep-dives/neon-realtime")({
  head: () => ({ meta: [{ title: "Neon Realtime sync — Try TanStack DB" }] }),
  component: NeonRealtimePage,
});

/** The versions this page was written against. Realtime is experimental: check before upgrading. */
const NEON_REALTIME_TANSTACK_VERSION = "0.1.1";
const NEON_REALTIME_VERSION = "0.1.1";

function NeonRealtimePage() {
  return (
    <DeepDivePage
      title="Neon Realtime sync"
      intro={<p>Stream changes from Postgres into a collection, instead of fetching them.</p>}
    >
      <Callout variant="warning" title="Experimental">
        Neon Realtime is experimental, and its APIs may change. This page describes{" "}
        <code>@neon/realtime-tanstack@{NEON_REALTIME_TANSTACK_VERSION}</code> with{" "}
        <code>@neon/realtime@{NEON_REALTIME_VERSION}</code>. Pin exact versions if you try it.
      </Callout>

      <p>
        Query collections, like the ones in the Notes app, fetch data. They don't hear about changes
        someone else makes until they fetch again. Neon Realtime pushes changes instead: your
        backend <em>seals</em> a SQL query, the browser subscribes to it over a WebSocket, and gets
        the full result followed by batches of changes whenever those rows change in Postgres.
      </p>

      <h3>The collection</h3>
      <p>
        <code>realtimeCollectionOptions()</code>, from <code>@neon/realtime-tanstack</code>, turns
        that subscription into a TanStack DB collection. This example is from the package's README:
      </p>
      <SourceSnippet snippet={NEON_README_SNIPPETS.collection} />
      <p>
        <code>sealTodos</code> stands for a call to your backend that returns a sealed query.{" "}
        <code>refreshQuery</code> gets a new one before the current one expires. The collection
        always syncs eagerly: it holds the query's whole result, and live queries filter it in the
        browser like any other collection.
      </p>

      <h3>Optimistic writes</h3>
      <p>
        Writes still go through your own API, and the optimistic part works as in the Notes app. The
        difference is how the handler knows the write is done. The API returns the ID of the
        Postgres transaction that made the change, and the handler waits for that transaction to
        come through the stream with <code>collection.utils.awaitTxId(txid)</code>:
      </p>
      <SourceSnippet snippet={NEON_README_SNIPPETS.awaitTxId} />
      <p>
        Until then, the optimistic change stays on screen. Once the transaction arrives, the
        streamed row is already in the collection, and the optimistic copy is dropped. In the Notes
        app, handlers write back what the API returned instead (<code>writeUpdate</code>); with
        Realtime, the stream is the source of truth.
      </p>
      <ul>
        <li>
          Read the transaction ID inside the same database transaction as the write, and only pass
          IDs of transactions that committed.
        </li>
        <li>
          <code>awaitTxId</code> waits for as long as it takes by default. Pass a timeout in
          milliseconds as the second argument to stop waiting.
        </li>
        <li>It also works when the change arrives in the stream before the HTTP response does.</li>
      </ul>

      <Callout variant="note" title="TODO: a demo">
        This page has no live demo yet. <code>@neon/realtime-tanstack</code>{" "}
        {NEON_REALTIME_TANSTACK_VERSION} needs TanStack DB 0.9 (peer dependency{" "}
        <code>@tanstack/db@^0.9.0</code>), and this app runs <code>1.0.0-rc.1.2</code>, so the
        package isn't installed here, and there's no simulated stream yet.
      </Callout>
    </DeepDivePage>
  );
}
