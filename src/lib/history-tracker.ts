import { useRouter } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

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
  paths[index] = history.location.pathname;
  let snapshot: HistorySnapshot = { index, lastIndex: index, paths };
  const listeners = new Set<() => void>();

  history.subscribe(({ location, action }) => {
    const index = entryIndex(location.state);
    const paths = [...snapshot.paths];
    // A push discards everything that was ahead of the new entry.
    if (action.type === "PUSH") paths.length = index;
    paths[index] = location.pathname;
    snapshot = {
      index,
      lastIndex: action.type === "PUSH" ? index : Math.max(snapshot.lastIndex, index),
      paths,
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

/** Pathname of the entry "back" would go to, if we've seen it. */
export function usePreviousPath(): string | undefined {
  const { index, paths } = useHistorySnapshot();
  return paths[index - 1];
}
