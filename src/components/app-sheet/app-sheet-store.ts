import { useSyncExternalStore } from "react";

/**
 * On small screens the app lives in a sheet over the guide. Whether it's open
 * lives outside React so anything can open it: a section's "Try it" button
 * today, and in phase 4 e.g. a guide link that opens the request inspector.
 */
export type AppSheetView = "app" | "network";

export interface AppSheetState {
  open: boolean;
  /** What the sheet shows: the app, or the latency controls and request inspector over it. */
  view: AppSheetView;
  /** The guide section the sheet was opened from, if any. */
  sectionId: string | null;
}

let state: AppSheetState = { open: false, view: "app", sectionId: null };
const listeners = new Set<() => void>();

function update(next: AppSheetState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openAppSheet({
  sectionId = null,
  view = "app",
}: { sectionId?: string | null; view?: AppSheetView } = {}) {
  update({ open: true, view, sectionId });
}

export function closeAppSheet() {
  if (!state.open) return;
  update({ ...state, open: false });
}

export function setAppSheetView(view: AppSheetView) {
  if (view === state.view) return;
  update({ ...state, view });
}

export function getAppSheetState(): AppSheetState {
  return state;
}

export function useAppSheet(): AppSheetState {
  return useSyncExternalStore(subscribe, getAppSheetState, getAppSheetState);
}
