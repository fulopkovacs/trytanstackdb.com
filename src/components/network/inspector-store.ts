import { createStore, useStore } from "@/lib/store";

/**
 * Whether the request inspector drawer is open under the app (wide screens).
 * On phones the inspector is part of the app sheet's Network view instead
 * (see `app-sheet-store.ts`).
 */
export const inspectorOpenStore = createStore(false);

export function setInspectorOpen(open: boolean) {
  inspectorOpenStore.set(open);
}

export function useIsInspectorOpen(): boolean {
  return useStore(inspectorOpenStore);
}
