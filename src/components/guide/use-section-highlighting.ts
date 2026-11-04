import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { GUIDE_SECTIONS } from "@/guide/content";
import { subscribeToAppActions } from "@/lib/app-actions";
import {
  INITIAL_APP_SNAPSHOT,
  nextAppSnapshot,
  screenFromRouteId,
  sectionForAppState,
} from "@/lib/app-state";
import type { AppPanel, AppSnapshot, AppStateInput } from "@/lib/app-state";

import { setActiveSection } from "./guide-store";

/**
 * Lights up the guide section that matches what the reader is doing in the
 * app: the screen they're on, what they just did, and the open panel. When
 * nothing matches, the last highlight stays, so wandering around the app
 * doesn't keep switching it off.
 */
export function useSectionHighlighting(panel: AppPanel | null) {
  const snapshotRef = useRef<AppSnapshot>(INITIAL_APP_SNAPSHOT);

  const applyRef = useRef((input: AppStateInput) => {
    const next = nextAppSnapshot(snapshotRef.current, input);
    if (next === snapshotRef.current) return;
    snapshotRef.current = next;
    const sectionId = sectionForAppState(next, GUIDE_SECTIONS);
    if (sectionId) setActiveSection(sectionId);
  });

  // The screen, as `routeId|folderId|noteId` so it only changes when one of them does.
  const screenKey = useRouterState({
    select: (state) => {
      const match = state.matches.at(-1);
      if (!match) return "";
      const params = match.params as { folderId?: string; noteId?: string };
      return [match.routeId, params.folderId ?? "", params.noteId ?? ""].join("|");
    },
  });

  // Actions first: a click reports `folder.opened` before the route changes.
  useEffect(
    () => subscribeToAppActions((event) => applyRef.current({ kind: "action", event })),
    [],
  );

  useEffect(() => {
    const [routeId = "", folderId, noteId] = screenKey.split("|");
    applyRef.current({
      kind: "navigated",
      screen: screenFromRouteId(routeId),
      params: { ...(folderId ? { folderId } : {}), ...(noteId ? { noteId } : {}) },
    });
  }, [screenKey]);

  useEffect(() => {
    applyRef.current({ kind: "panel", panel });
  }, [panel]);
}
