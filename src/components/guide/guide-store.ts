import { useSyncExternalStore } from "react";

/**
 * Which guide section is "active" (highlighted). Phase 4 sets this from app
 * state; for now it can be set from the dev controls in the guide header.
 */
let activeSectionId: string | null = null;
const listeners = new Set<() => void>();

export function setActiveSection(id: string | null) {
  if (id === activeSectionId) return;
  activeSectionId = id;
  for (const listener of listeners) listener();
}

export function getActiveSection(): string | null {
  return activeSectionId;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useActiveSection(): string | null {
  return useSyncExternalStore(subscribe, getActiveSection, () => null);
}
