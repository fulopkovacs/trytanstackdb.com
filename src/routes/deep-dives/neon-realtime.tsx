import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { Callout } from "@/components/guide/callout";
import { DeepDivePage } from "@/components/guide/deep-dive-page";
import { RealtimeDemo } from "@/components/guide/realtime-demo";
import { SourceSnippet } from "@/components/guide/source-snippet";
import { NEON_README_SNIPPETS, SNIPPETS } from "@/guide/snippets";

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

      <h3>Try it: a simulation</h3>
      <Callout variant="warning" title="A simulation, not the package">
        <code>@neon/realtime-tanstack</code> {NEON_REALTIME_TANSTACK_VERSION} needs TanStack DB 0.9
        (peer dependency <code>@tanstack/db@^0.9.0</code>), and this app runs{" "}
        <code>1.0.0-rc.1.2</code>, so the package isn't installed here. The demo below follows the
        same flow with a stand-in collection built from TanStack DB's own sync primitives, and a
        simulated stream from the fake API instead of a Neon WebSocket.
      </Callout>
      <p>
        Rename the note. Each step shows up as it happens. The simulated stream takes a second and a
        half to deliver a change, longer than the API takes to answer, so you can see the handler
        wait.
      </p>
      <ClientOnly fallback={<div className="my-5 h-56 rounded-xl border bg-muted/40" />}>
        <RealtimeDemo />
      </ClientOnly>
      <p>
        On the server side, the write endpoint saves the change and answers with the id of the
        database transaction that saved it:
      </p>
      <SourceSnippet snippet={SNIPPETS.livePatchNote} />
      <p>
        The stand-in collection applies the stream's rows as synced data with <code>begin</code>,{" "}
        <code>write</code> and <code>commit</code>. Its <code>onUpdate</code> handler has the same
        shape as the README's: send the change, then wait for its txid. Like the Notes app's
        collections, it saves one change per note at a time, so an older rename can't land after a
        newer one.
      </p>
      <SourceSnippet snippet={SNIPPETS.realtimeNotesCollection} />
      <p>
        A stream batch is accepted as soon as it's committed. While the handler's transaction is
        still running, TanStack DB holds the batch back and shows it together with dropping the
        optimistic copy, so the title never flickers. That's why the handler can stop waiting once
        the batch is committed. The waiting is a little bookkeeping that belongs to one sync run.
        Batches arrive in commit order, so it only keeps the last txid it saw. Each write belongs to
        the run it started in, and cleaning up the collection fails every write still in progress,
        including one still waiting for the API's answer:
      </p>
      <SourceSnippet snippet={SNIPPETS.syncRun} />
      <p>
        This collection is only used on this page. The rename is saved on the same fake API as the
        Notes app; the app's own notes collection sees it the next time it loads notes.
      </p>
    </DeepDivePage>
  );
}
