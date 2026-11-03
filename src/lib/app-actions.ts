/**
 * Things the reader does in the Notes app, as typed events. The guide
 * listens to them: a section is marked done when its hands-on action happens
 * (see `doneWhen` in `guide/content.tsx`), and phase 4 highlights sections
 * from them.
 *
 * Mutations report up to three times: `applied` when the optimistic change
 * shows up, then `confirmed` when the server accepted it or `rolled-back`
 * when it didn't. Navigation actions only have `applied`.
 */
export type AppAction =
  | { type: "folder.opened"; folderId: string; smart: boolean }
  | { type: "note.opened"; noteId: string }
  | { type: "note.created"; noteId: string; folderId: string }
  | { type: "note.edited"; noteId: string }
  | { type: "note.pinned"; noteId: string; pinned: boolean }
  | { type: "note.moved"; noteId: string; folderId: string }
  | { type: "note.deleted"; noteId: string; permanently: boolean }
  | { type: "note.restored"; noteId: string }
  | { type: "folder.renamed"; folderId: string; name: string }
  | { type: "account.updated" };

export type AppActionType = AppAction["type"];

export type AppActionStatus = "applied" | "confirmed" | "rolled-back";

export type AppActionEvent = AppAction & {
  status: AppActionStatus;
  /** Why the server rejected the change (`rolled-back` only). */
  error?: Error;
};

/**
 * Matches events by any of their fields, e.g. `{ type: "note.edited" }` or
 * `{ status: "rolled-back" }`. All given fields must be equal.
 */
export type AppActionMatcher = {
  [T in AppActionType]: Partial<Extract<AppAction, { type: T }>> & { type?: T };
}[AppActionType] & { status?: AppActionStatus };

export function matchesAppAction(matcher: AppActionMatcher, event: AppActionEvent): boolean {
  return Object.entries(matcher).every(
    ([key, value]) => (event as Record<string, unknown>)[key] === value,
  );
}

type Listener = (event: AppActionEvent) => void;

const listeners = new Set<Listener>();

export function emitAppAction(event: AppActionEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribeToAppActions(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reports something that doesn't go through the server, like opening a folder. */
export function reportAction(action: AppAction) {
  emitAppAction({ ...action, status: "applied" });
}

/**
 * Reports a mutation: `applied` now, then `confirmed` or `rolled-back` once
 * its transaction settles. Reporting the same transaction again (paced
 * mutations merge many edits into one) only adds another `applied`.
 */
export function reportMutation(
  action: AppAction,
  transaction: { when: (state: "settled") => Promise<unknown> },
) {
  emitAppAction({ ...action, status: "applied" });
  if (reportedTransactions.has(transaction)) return;
  reportedTransactions.add(transaction);
  transaction.when("settled").then(
    () => emitAppAction({ ...action, status: "confirmed" }),
    (error: unknown) =>
      emitAppAction({
        ...action,
        status: "rolled-back",
        error: error instanceof Error ? error : new Error(String(error)),
      }),
  );
}

const reportedTransactions = new WeakSet<object>();
