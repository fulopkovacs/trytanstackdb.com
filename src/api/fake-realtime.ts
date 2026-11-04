import type { Note } from "@/db/schema";
import { createStore, useStore } from "@/lib/store";

import { snapshotNotes, subscribeToNoteCommits } from "./fake-fetch";
import type { NoteRowChange } from "./fake-server";

/**
 * SIMULATION of a Neon Realtime live query over the notes table, for the
 * Neon deep dive. Not the real protocol: like Neon's raw subscription, it
 * sends the query's complete result first, then one batch of row changes per
 * committed database transaction, tagged with that transaction's id, in
 * commit order (so ids only go up). Here
 * the "database" is the fake API's in-memory server, and the "WebSocket" is
 * a timer.
 */

export type LiveNotesMessage =
  /** The complete result, as of transaction `txid`. */
  | { type: "rows"; rows: Note[]; txid: string }
  /** The rows one committed transaction changed. */
  | { type: "changes"; txid: string; changes: NoteRowChange[] };

/** How long a message takes to arrive. Longer than the API's answer, so the wait is visible. */
let streamDelayMs = 1500;

export function setStreamDelay(ms: number) {
  streamDelayMs = ms;
}

export interface StreamLogEntry {
  id: number;
  receivedAt: number;
  message: LiveNotesMessage;
}

/** What the stream delivered, newest last (for the demo). */
export const streamLogStore = createStore<readonly StreamLogEntry[]>([]);
let nextLogId = 1;

export function useStreamLog(): readonly StreamLogEntry[] {
  return useStore(streamLogStore);
}

/**
 * Subscribes to every note. Messages arrive in the order they were sent,
 * like on one WebSocket: a message is never delivered before an earlier
 * one, even if the delay changes in between. Returns a function that ends
 * the subscription.
 */
export function subscribeToLiveNotes(onMessage: (message: LiveNotesMessage) => void): () => void {
  let active = true;
  const queue: { message: LiveNotesMessage; dueAt: number }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  function deliver(message: LiveNotesMessage) {
    const dueAt = Math.max(Date.now() + streamDelayMs, queue.at(-1)?.dueAt ?? 0);
    queue.push({ message, dueAt });
    if (queue.length === 1) scheduleNext();
  }

  function scheduleNext() {
    const next = queue[0];
    if (next) timer = setTimeout(flush, Math.max(0, next.dueAt - Date.now()));
  }

  function flush() {
    while (active && queue[0] && queue[0].dueAt <= Date.now()) {
      const { message } = queue.shift()!;
      streamLogStore.set((log) =>
        [...log, { id: nextLogId++, receivedAt: Date.now(), message }].slice(-50),
      );
      onMessage(message);
    }
    if (active) scheduleNext();
  }

  // Changes committed from now on follow the snapshot, in commit order.
  const unsubscribe = subscribeToNoteCommits((commit) => deliver({ type: "changes", ...commit }));
  deliver({ type: "rows", ...snapshotNotes() });

  return () => {
    active = false;
    unsubscribe();
    clearTimeout(timer);
  };
}
