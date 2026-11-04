import { createCollection } from "@tanstack/react-db";

import { api } from "@/api/client";
import { subscribeToLiveNotes } from "@/api/fake-realtime";

import { inOrder, saveEach } from "./write-queue";
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

// #region txid-tracker
interface TxidWaiter {
  txid: bigint;
  resolve: (seen: true) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * The transactions one sync run has seen, and the writes waiting for one.
 * The stream delivers transactions in commit order, so "seen" is a single
 * high-water mark: the last transaction id it delivered.
 */
export function createTxidTracker() {
  let seenUpTo = -1n;
  const waiters = new Set<TxidWaiter>();

  function settle(waiter: TxidWaiter) {
    clearTimeout(waiter.timer);
    waiters.delete(waiter);
  }

  return {
    /** The stream has delivered everything up to and including `txid`. */
    seen(txid: string) {
      if (BigInt(txid) > seenUpTo) seenUpTo = BigInt(txid);
      for (const waiter of waiters) {
        if (waiter.txid > seenUpTo) continue;
        settle(waiter);
        waiter.resolve(true);
      }
    },

    /** Resolves once `txid` has been delivered, even if it already was. */
    wait(txid: string, timeout?: number): Promise<true> {
      if (BigInt(txid) <= seenUpTo) return Promise.resolve(true);
      return new Promise((resolve, reject) => {
        const waiter: TxidWaiter = { txid: BigInt(txid), resolve, reject };
        if (timeout !== undefined) {
          waiter.timer = setTimeout(() => {
            settle(waiter);
            reject(new Error(`Timed out waiting for transaction ${txid}.`));
          }, timeout);
        }
        waiters.add(waiter);
      });
    },

    /** Ends the run: every write still waiting fails. */
    close(reason: Error) {
      for (const waiter of waiters) {
        settle(waiter);
        waiter.reject(reason);
      }
    },

    get waiting(): number {
      return waiters.size;
    },
  };
}

type TxidTracker = ReturnType<typeof createTxidTracker>;

/** The running sync's tracker; there's none before sync starts or after cleanup. */
let activeTracker: TxidTracker | undefined;

/**
 * Like the package's `collection.utils.awaitTxId(txid, timeout?)`: resolves
 * once the stream has delivered `txid`, also when it arrived before the
 * API's answer did. Rejects on timeout and when the collection is cleaned up.
 */
function awaitTxId(txid: string, timeout?: number): Promise<true> {
  if (!activeTracker) return Promise.reject(new Error("The collection isn't syncing."));
  return activeTracker.wait(txid, timeout);
}
// #endregion txid-tracker

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
      const tracker = createTxidTracker();
      activeTracker = tracker;
      const keys = new Set<string>();

      const unsubscribe = subscribeToLiveNotes((message) => {
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
        } else {
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
          // state it confirms. So a write waiting for this txid can finish.
          void commit();
        }
        tracker.seen(message.txid);
      });

      return () => {
        unsubscribe();
        tracker.close(new Error("The collection was cleaned up."));
        if (activeTracker === tracker) activeTracker = undefined;
      };
    },
  },
  onUpdate: ({ transaction, collection }) =>
    saveEach(transaction.mutations, ({ key, changes }) =>
      // One save at a time per note, so an older change can't land last.
      inOrder(`/api/live/notes/${key}`, async () => {
        // The API saves the change and answers with its transaction id…
        const { txid } = await api.patch<{ txid: string }>(`/api/live/notes/${key}`, changes);
        // …and the optimistic change stays on screen until the stream delivers it.
        await collection.utils.awaitTxId(txid);
      }),
    ),
});
// #endregion realtime-notes-collection
