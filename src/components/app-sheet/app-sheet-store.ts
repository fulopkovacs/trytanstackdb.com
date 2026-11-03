import { useLocation, useRouter } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import { useCallback, useSyncExternalStore } from "react";

import { closeSheetAction, isSheetOpen, openSheetState } from "@/lib/app-sheet-history";
import { isOnScreen } from "@/lib/app-screen";

/**
 * On small screens the app lives in a sheet over the guide. Whether the sheet
 * is open is part of browser history (see `lib/app-sheet-history.ts`); this
 * store only holds what's on top of that:
 *
 * - which view the sheet shows: the app, or the latency controls and request
 *   inspector over it,
 * - the guide section it was last opened from (phase 4 watches for that
 *   section's action),
 * - where the app was when the sheet last closed, so "Try it" can pick up
 *   there instead of starting over.
 */
export type AppSheetView = "app" | "network";

interface AppSheetState {
  view: AppSheetView;
  sectionId: string | null;
}

let state: AppSheetState = { view: "app", sectionId: null };
let lastSheetHref: string | null = null;
const listeners = new Set<() => void>();

function update(next: AppSheetState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAppSheetView(view: AppSheetView) {
  if (view !== state.view) update({ ...state, view });
}

export function useAppSheetView(): AppSheetView {
  return useSyncExternalStore(
    subscribe,
    () => state.view,
    () => state.view,
  );
}

/** Called while the sheet is open, with the app's current location. */
export function rememberSheetLocation(href: string) {
  lastSheetHref = href;
}

export function useIsAppSheetOpen(): boolean {
  return useLocation({ select: (location) => isSheetOpen(location.state, location.pathname) });
}

/** Opens the app sheet on a guide section's screen. */
export function useOpenAppSheet() {
  const router = useRouter();
  return useCallback(
    (sectionId: string, target: LinkOptions) => {
      const screen = router.buildLocation(target).pathname;
      const { location } = router.history;
      // Already on that screen (or deeper in it), now or when the sheet last
      // closed? Pick up there; otherwise open the section's screen.
      const resumeHref = [location.href, lastSheetHref].find(
        (href) =>
          href !== null && isOnScreen(new URL(href, window.location.origin).pathname, screen),
      );
      update({ view: "app", sectionId });
      void router.navigate({
        ...(resumeHref ? { href: resumeHref } : target),
        state: (previous) => ({ ...previous, ...openSheetState(location.state.__TSR_index) }),
      });
    },
    [router],
  );
}

/** Closes the sheet by going back to before it opened, or by recording it closed. */
export function useCloseAppSheet() {
  const router = useRouter();
  return useCallback(() => {
    const { location } = router.history;
    const action = closeSheetAction(location.state, location.state.__TSR_index);
    if (action.type === "go") {
      router.history.go(action.delta);
    } else {
      void router.navigate({
        href: location.href,
        replace: true,
        resetScroll: false,
        state: (previous) => ({ ...previous, ...action.state }),
      });
    }
  }, [router]);
}
