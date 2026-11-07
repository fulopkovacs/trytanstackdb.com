import { useRouter } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

import { isSheetOpen } from "./app-sheet-history";

/**
 * Remembers the history entries we've seen, for as long as the router lives.
 * The History API can't tell us whether "forward" is possible or what the
 * previous entry was, so we record every navigation ourselves. Living outside
 * React means remounting the browser frame (e.g. on a responsive layout
 * change) doesn't lose track.
 */
export interface HistorySnapshot {
  /** Position of the current entry (`__TSR_index`). */
  index: number;
  /** Furthest entry reachable with "forward". */
  lastIndex: number;
  /** Pathnames by index, for the entries we've seen. */
  paths: ReadonlyArray<string | undefined>;
  /** Whether each entry has the app sheet open (small screens; see `app-sheet-history.ts`). */
  sheetOpen: ReadonlyArray<boolean | undefined>;
}

interface Tracker {
  getSnapshot: () => HistorySnapshot;
  subscribe: (listener: () => void) => () => void;
}

const trackers = new WeakMap<RouterHistory, Tracker>();

function entryIndex(state: unknown): number {
  return (state as { __TSR_index?: number } | null)?.__TSR_index ?? 0;
}

function createTracker(history: RouterHistory): Tracker {
  const index = entryIndex(history.location.state);
  const paths: Array<string | undefined> = [];
  const sheetOpen: Array<boolean | undefined> = [];
  paths[index] = history.location.pathname;
  sheetOpen[index] = isSheetOpen(history.location.state, history.location.pathname);
  let snapshot: HistorySnapshot = { index, lastIndex: index, paths, sheetOpen };
  const listeners = new Set<() => void>();

  history.subscribe(({ location, action }) => {
    const index = entryIndex(location.state);
    const paths = [...snapshot.paths];
    const sheetOpen = [...snapshot.sheetOpen];
    // A push discards everything that was ahead of the new entry.
    if (action.type === "PUSH") paths.length = sheetOpen.length = index;
    paths[index] = location.pathname;
    sheetOpen[index] = isSheetOpen(location.state, location.pathname);
    snapshot = {
      index,
      lastIndex: action.type === "PUSH" ? index : Math.max(snapshot.lastIndex, index),
      paths,
      sheetOpen,
    };
    for (const listener of listeners) listener();
  });

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function trackerFor(history: RouterHistory): Tracker {
  let tracker = trackers.get(history);
  if (!tracker) {
    tracker = createTracker(history);
    trackers.set(history, tracker);
  }
  return tracker;
}

export function useHistorySnapshot(): HistorySnapshot {
  const { history } = useRouter();
  const tracker = trackerFor(history);
  return useSyncExternalStore(tracker.subscribe, tracker.getSnapshot, tracker.getSnapshot);
}

/** The entry "back" would go to, if we've seen it. */
export function usePreviousEntry(): { pathname: string; sheetOpen: boolean } | undefined {
  const { index, paths, sheetOpen } = useHistorySnapshot();
  const pathname = paths[index - 1];
  return pathname === undefined
    ? undefined
    : { pathname, sheetOpen: sheetOpen[index - 1] ?? false };
}

/** Whether the current entry has the app sheet open. */
export function useCurrentEntrySheetOpen(): boolean {
  const { index, sheetOpen } = useHistorySnapshot();
  return sheetOpen[index] ?? false;
}
