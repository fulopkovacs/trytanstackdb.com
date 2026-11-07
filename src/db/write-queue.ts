/**
 * Two small helpers the collection handlers use to save safely.
 */

const lastWrite = new Map<string, Promise<unknown>>();

/**
 * Runs the writes for one record (keyed by its URL) one at a time, in the
 * order the handlers asked for them. A write here is the request and the
 * confirmed row it writes back, so an older save can't reach the server,
 * or the collection, after a newer one. Optimistic updates don't wait: only
 * the requests do.
 *
 * If a write fails, the writes queued behind it for the same record fail
 * too, without being sent: they were made on top of a change the server
 * rejected (TanStack DB rolls those transactions back as well).
 */
export function inOrder<T>(resource: string, write: () => Promise<T>): Promise<T> {
  const next = (lastWrite.get(resource) ?? Promise.resolve()).then(write);
  lastWrite.set(resource, next);
  const forget = () => {
    if (lastWrite.get(resource) === next) lastWrite.delete(resource);
  };
  next.then(forget, forget);
  return next;
}

/**
 * Saves every mutation of a transaction and waits for all of them, then
 * throws the first error, if any. Unlike `Promise.all`, one rejected record
 * doesn't stop the others from being confirmed: the transaction still rolls
 * back, but records the server accepted keep their saved values.
 */
export async function saveEach<TMutation>(
  mutations: TMutation[],
  save: (mutation: TMutation) => Promise<void>,
): Promise<void> {
  const results = await Promise.allSettled(mutations.map(save));
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}
