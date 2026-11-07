/**
 * Whether the app sheet is open lives in browser history, so Back/Forward,
 * reloads and direct links all agree with what's on screen.
 *
 * The contract (small screens; the split layout ignores it):
 *
 * - Every history entry records `appSheet: boolean` in its history state
 *   (not the URL, so the fake address bar never shows it).
 * - "Try it" pushes an entry with the sheet open and remembers that entry's
 *   index in `appSheetOpenedAt`.
 * - Navigating without saying anything about the sheet (any link inside the
 *   app) inherits the current entry's state, so the sheet stays open while
 *   you use the app. See `withSheetState`.
 * - Back/Forward land on entries that carry their own state, so backing out
 *   past the entry that opened the sheet closes it.
 * - Closing (button, swipe, backdrop, Escape) goes back to the entry before
 *   the sheet opened if we know it; otherwise (the sheet opened on a direct
 *   load) it replaces the current entry with a closed one. See `closeSheetAction`.
 * - An entry with no record (a direct load, a link from outside) is open on
 *   any app screen except the root, so a shared note link shows the note.
 */

export interface SheetHistoryState {
  appSheet?: boolean;
  /** History index of the entry that opened the sheet ("Try it"). */
  appSheetOpenedAt?: number;
}

const ROOT_PATHNAME = "/";

export function readSheetState(state: unknown): SheetHistoryState {
  if (typeof state !== "object" || state === null) return {};
  const { appSheet, appSheetOpenedAt } = state as Record<string, unknown>;
  return {
    appSheet: typeof appSheet === "boolean" ? appSheet : undefined,
    appSheetOpenedAt: typeof appSheetOpenedAt === "number" ? appSheetOpenedAt : undefined,
  };
}

export function isSheetOpen(state: unknown, pathname: string): boolean {
  return readSheetState(state).appSheet ?? pathname !== ROOT_PATHNAME;
}

/**
 * The state to store for a new entry. If the navigation says whether the
 * sheet is open, that wins; otherwise the entry inherits the current one's.
 */
export function withSheetState<T extends object>(
  current: { state: unknown; pathname: string },
  next: T | undefined,
): T & SheetHistoryState {
  if (next && "appSheet" in next) return next as T & SheetHistoryState;
  const appSheet = isSheetOpen(current.state, current.pathname);
  const { appSheetOpenedAt } = readSheetState(current.state);
  return {
    ...(next as T),
    appSheet,
    ...(appSheet && appSheetOpenedAt !== undefined ? { appSheetOpenedAt } : {}),
  };
}

/** State for the entry "Try it" pushes from the entry at `currentIndex`. */
export function openSheetState(currentIndex: number): SheetHistoryState {
  return { appSheet: true, appSheetOpenedAt: currentIndex + 1 };
}

export type CloseSheetAction =
  | { type: "go"; delta: number }
  | { type: "replace"; state: SheetHistoryState };

export function closeSheetAction(state: unknown, currentIndex: number): CloseSheetAction {
  const { appSheetOpenedAt } = readSheetState(state);
  if (appSheetOpenedAt !== undefined && appSheetOpenedAt >= 1 && appSheetOpenedAt <= currentIndex) {
    return { type: "go", delta: appSheetOpenedAt - 1 - currentIndex };
  }
  return { type: "replace", state: { appSheet: false, appSheetOpenedAt: undefined } };
}
