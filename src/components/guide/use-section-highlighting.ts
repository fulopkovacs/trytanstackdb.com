import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useAppSheetView, useIsAppSheetOpen } from "@/components/app-sheet/app-sheet-store";
import { useIsInspectorOpen } from "@/components/network/inspector-store";
import { GUIDE_SECTIONS } from "@/guide/content";
import { subscribeToAppActions } from "@/lib/app-actions";
import {
  INITIAL_APP_SNAPSHOT,
  isNews,
  nextAppSnapshot,
  screenFromRouteId,
  sectionForAppState,
} from "@/lib/app-state";
import type { AppPanel, AppSnapshot, AppStateInput } from "@/lib/app-state";

import { setActiveSection } from "./guide-store";

/**
 * The workspace's highlighting: the app is beside the guide (`isSplit`) or in
 * the sheet, and the request inspector is a drawer or the sheet's Network view.
 */
export function useWorkspaceSectionHighlighting(isSplit: boolean) {
  const inspectorOpen = useIsInspectorOpen();
  const sheetOpen = useIsAppSheetOpen();
  const sheetView = useAppSheetView();
  const inspectorShown = isSplit ? inspectorOpen : sheetOpen && sheetView === "network";
  useSectionHighlighting({
    panel: inspectorShown ? "inspector" : null,
    appOnScreen: isSplit || sheetOpen,
  });
}

/**
 * Lights up the guide section that matches what the reader is doing in the
 * app: the screen they're on, what they just did, and the open panel. When
 * nothing matches, the last highlight stays, so wandering around the app
 * doesn't keep switching it off.
 *
 * Route changes only count while the app is on screen (`appOnScreen`). On
 * phones, closing the sheet (Close, a swipe, Back) is a history navigation
 * back to where the guide was; that's the reader leaving the app, not using
 * it, so the highlight from the app stays. Opening the sheet again (Try it,
 * Forward) counts.
 */
export function useSectionHighlighting({
  panel,
  appOnScreen,
}: {
  panel: AppPanel | null;
  appOnScreen: boolean;
}) {
  const snapshotRef = useRef<AppSnapshot>(INITIAL_APP_SNAPSHOT);

  const applyRef = useRef((input: AppStateInput) => {
    const next = nextAppSnapshot(snapshotRef.current, input);
    if (next === snapshotRef.current) return;
    snapshotRef.current = next;
    if (!isNews(input)) return;
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
    if (!appOnScreen) return;
    const [routeId = "", folderId, noteId] = screenKey.split("|");
    applyRef.current({
      kind: "navigated",
      screen: screenFromRouteId(routeId),
      params: { ...(folderId ? { folderId } : {}), ...(noteId ? { noteId } : {}) },
    });
  }, [screenKey, appOnScreen]);

  useEffect(() => {
    applyRef.current({ kind: "panel", panel });
  }, [panel]);
}
