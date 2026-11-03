import { useSyncExternalStore } from "react";

/**
 * A tiny observable value for state that lives outside React (the fake API's
 * settings and request log), so plain modules can read and write it and
 * components can subscribe to it.
 */
export interface Store<T> {
  get: () => T;
  set: (next: T | ((previous: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Subscribes a component to a store. `select` must return a stable value (or a primitive). */
export function useStore<T, S = T>(store: Store<T>, select?: (value: T) => S): S {
  const getSnapshot = () => (select ? select(store.get()) : (store.get() as unknown as S));
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
