/**
 * Sends the writes for one record (keyed by its URL) one at a time, in the
 * order they were made. Without this, a slow save could reach the server
 * after a newer one and overwrite it, and an edit to a brand-new note could
 * arrive before the note was created.
 *
 * Optimistic updates don't wait for this: only the requests do.
 *
 * If a write fails, the writes queued behind it for the same record fail
 * too, without being sent: they were made on top of a change the server
 * rejected (TanStack DB rolls those transactions back as well).
 */
const lastWrite = new Map<string, Promise<unknown>>();

export function inOrder<T>(resource: string, write: () => Promise<T>): Promise<T> {
  const next = (lastWrite.get(resource) ?? Promise.resolve()).then(write);
  lastWrite.set(resource, next);
  const forget = () => {
    if (lastWrite.get(resource) === next) lastWrite.delete(resource);
  };
  next.then(forget, forget);
  return next;
}
