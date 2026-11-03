import { useSyncExternalStore } from "react";

/**
 * Guide state that lives outside React, so the app and the guide can both
 * reach it:
 *
 * - the "active" (highlighted) section. Phase 4 sets it from app state; for
 *   now it can be set from the dev menu in the guide header.
 * - which sections the reader has done (did the section's hands-on step).
 *   `guide/section-progress.ts` marks a section done when the app reports
 *   the section's action (its `doneWhen` in `guide/content.tsx`).
 */
interface GuideState {
  activeSectionId: string | null;
  doneSectionIds: ReadonlySet<string>;
}

let state: GuideState = { activeSectionId: null, doneSectionIds: new Set() };
const listeners = new Set<() => void>();

function update(next: GuideState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActiveSection(id: string | null) {
  if (id === state.activeSectionId) return;
  update({ ...state, activeSectionId: id });
}

export function getActiveSection(): string | null {
  return state.activeSectionId;
}

export function useActiveSection(): string | null {
  return useSyncExternalStore(subscribe, getActiveSection, () => null);
}

export function markSectionDone(id: string) {
  if (state.doneSectionIds.has(id)) return;
  update({ ...state, doneSectionIds: new Set(state.doneSectionIds).add(id) });
}

export function markSectionNotDone(id: string) {
  if (!state.doneSectionIds.has(id)) return;
  const doneSectionIds = new Set(state.doneSectionIds);
  doneSectionIds.delete(id);
  update({ ...state, doneSectionIds });
}

export function isSectionDone(id: string): boolean {
  return state.doneSectionIds.has(id);
}

/** The done section ids. A new set only when something changed, so it's safe as a snapshot. */
export function getDoneSections(): ReadonlySet<string> {
  return state.doneSectionIds;
}

const noDoneSections: ReadonlySet<string> = new Set();

export function useDoneSections(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getDoneSections, () => noDoneSections);
}

export function useIsSectionDone(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isSectionDone(id),
    () => false,
  );
}
