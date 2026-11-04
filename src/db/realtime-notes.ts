import { createCollection } from "@tanstack/react-db";

import { api } from "@/api/client";
import { subscribeToLiveNotes } from "@/api/fake-realtime";

import type { Note } from "./schema";

/**
 * SIMULATION, for the Neon Realtime deep dive. This is not
 * `@neon/realtime-tanstack`: that package needs TanStack DB 0.9, and this app
 * runs 1.0. It's a stand-in built from TanStack DB's own sync primitives, over
 * a simulated stream from the fake API (`api/fake-realtime.ts`), that follows
 * the same flow: the stream's rows are the collection's synced data, and a
 * write waits for its transaction id to come through the stream.
 *
 * The Notes app doesn't use this collection.
 */

// #region await-txid
/** Transaction ids the stream has delivered, and handlers waiting for one. */
const arrivedTxids = new Set<string>();
const txidWaiters = new Map<string, Set<() => void>>();

function txidArrived(txid: string) {
  arrivedTxids.add(txid);
  for (const resolve of txidWaiters.get(txid) ?? []) resolve();
  txidWaiters.delete(txid);
}

/**
 * Resolves once the stream has delivered `txid`, like the package's
 * `collection.utils.awaitTxId(txid, timeout?)`. It also works when the
 * change arrived before the API's answer did.
 */
function awaitTxId(txid: string, timeout?: number): Promise<boolean> {
  if (arrivedTxids.has(txid)) return Promise.resolve(true);
  return new Promise((resolve, reject) => {
    const waiters = txidWaiters.get(txid) ?? new Set();
    txidWaiters.set(txid, waiters);
    const timer =
      timeout === undefined
        ? undefined
        : setTimeout(() => {
            waiters.delete(done);
            reject(new Error(`Timed out waiting for transaction ${txid}`));
          }, timeout);
    function done() {
      clearTimeout(timer);
      resolve(true);
    }
    waiters.add(done);
  });
}
// #endregion await-txid

// #region realtime-notes-collection
export const realtimeNotesCollection = createCollection<
  Note,
  string,
  { awaitTxId: typeof awaitTxId }
>({
  id: "notes-realtime-simulation",
  getKey: (note) => note.id,
  utils: { awaitTxId },
  sync: {
    // Each message carries whole rows.
    rowUpdateMode: "full",
    sync: ({ begin, write, commit, markReady }) => {
      const keys = new Set<string>();
      return subscribeToLiveNotes((message) => {
        if (message.type === "rows") {
          // The query's complete result: replaces whatever was there.
          begin({ snapshot: true });
          keys.clear();
          for (const row of message.rows) {
            keys.add(row.id);
            write({ type: "insert", value: row });
          }
          void commit();
          markReady();
          return;
        }
        // One committed database transaction: apply it as one sync transaction.
        begin();
        for (const change of message.changes) {
          if (change.type === "delete") {
            keys.delete(change.key);
            write({ type: "delete", key: change.key });
          } else {
            write({ type: keys.has(change.row.id) ? "update" : "insert", value: change.row });
            keys.add(change.row.id);
          }
        }
        // Accepted now; it shows up together with the end of the optimistic
        // state it confirms. So a handler waiting for this txid can return.
        void commit();
        txidArrived(message.txid);
      });
    },
  },
  onUpdate: async ({ transaction, collection }) => {
    const { key, changes } = transaction.mutations[0];
    // The API saves the change and answers with its transaction id…
    const { txid } = await api.patch<{ txid: string }>(`/api/live/notes/${key}`, changes);
    // …and the optimistic change stays on screen until the stream delivers it.
    await collection.utils.awaitTxId(txid);
  },
});
// #endregion realtime-notes-collection
