import { useEffect, useRef } from "react";

import type { SpotlightTarget } from "./spotlight-targets";

/*
 * Some spotlight targets can be hidden by app state the guide can't see:
 * the macOS sidebar toggled off, the iPhone Folders screen's iCloud section
 * collapsed. Whatever owns that state registers a "reveal" for the target,
 * and the spotlight asks for it before it looks for the target.
 */

const revealers = new Map<SpotlightTarget, Set<() => void>>();

/** Asks whoever can hide `target` to show it. */
export function revealSpotlightTarget(target: SpotlightTarget) {
  for (const reveal of revealers.get(target) ?? []) reveal();
}

/** Registers `reveal` (e.g. "open the sidebar") for `target` while mounted. */
export function useRevealForSpotlight(target: SpotlightTarget, reveal: () => void) {
  const revealRef = useRef(reveal);
  revealRef.current = reveal;
  useEffect(() => {
    const run = () => revealRef.current();
    const forTarget = revealers.get(target) ?? new Set();
    revealers.set(target, forTarget);
    forTarget.add(run);
    return () => {
      forTarget.delete(run);
    };
  }, [target]);
}
