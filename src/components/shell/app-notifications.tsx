import { useEffect } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { exposeFakeApiOnWindow } from "@/api/dev-console";
import { trackSectionProgress } from "@/guide/section-progress";
import { useMediaQuery } from "@/hooks/use-media-query";
import { subscribeToAppActions } from "@/lib/app-actions";
import type { AppAction, AppActionEvent } from "@/lib/app-actions";
import { SPLIT_LAYOUT_MIN_WIDTH } from "@/lib/layout";

const FAILED: { [T in AppAction["type"]]?: (action: Extract<AppAction, { type: T }>) => string } = {
  "note.created": () => "Couldn't create the note",
  "note.edited": () => "Couldn't save the note",
  "note.pinned": (action) => (action.pinned ? "Couldn't pin the note" : "Couldn't unpin the note"),
  "note.moved": () => "Couldn't move the note",
  "note.deleted": () => "Couldn't delete the note",
  "note.restored": () => "Couldn't recover the note",
  "folder.renamed": () => "Couldn't rename the folder",
  "account.updated": () => "Couldn't save your settings",
};

export interface RollbackNotice {
  /** Toasts with the same id replace each other. */
  id: string;
  title: string;
  description: string;
}

/** What to tell the reader when the server rejected a change (TanStack DB has already rolled it back). */
export function rollbackNotice(event: AppActionEvent): RollbackNotice | null {
  if (event.status !== "rolled-back") return null;
  const title =
    (FAILED[event.type] as ((action: AppAction) => string) | undefined)?.(event) ??
    "Couldn't save the change";
  const description = `${event.error?.message ?? "The server rejected it."} The change was undone.`;
  // One failed save also undoes the edits queued behind it: one toast for all of them.
  return { id: `${title}|${description}`, title, description };
}

function showRollbackToast({ id, title, description }: RollbackNotice) {
  toast.error(title, { id, description });
}

/**
 * Listens to the app's actions for as long as the page is open: rollback
 * toasts, and ticking off guide sections. Changes can settle after the
 * reader has left the Notes app (for a deep dive, say), so this must not
 * live inside it. Returns a stop function.
 */
export function startAppNotifications(
  notify: (notice: RollbackNotice) => void = showRollbackToast,
) {
  const stopProgress = trackSectionProgress();
  const stopToasts = subscribeToAppActions((event) => {
    const notice = rollbackNotice(event);
    if (notice) notify(notice);
  });
  return () => {
    stopProgress();
    stopToasts();
  };
}

/** Clears the iPhone layout's bottom bar (`--ios-bottom-bar`: 4rem plus the home indicator), with a gap. */
const SMALL_SCREEN_TOAST_OFFSET = { bottom: "calc(4.5rem + env(safe-area-inset-bottom))" };

/** Mounted once, in the root route, so every page (workspace and deep dives) shares it. */
export function AppNotifications() {
  const isSplit = useMediaQuery(`(min-width: ${SPLIT_LAYOUT_MIN_WIDTH}px)`);
  useEffect(() => startAppNotifications(), []);
  useEffect(() => exposeFakeApiOnWindow(), []);
  return isSplit ? (
    <Toaster position="bottom-right" closeButton />
  ) : (
    // Small screens: at the bottom, just above the iPhone app's floating
    // bars (search, the editor's toolbar). At the top they covered the app
    // sheet's Close and Network buttons.
    <Toaster
      position="bottom-center"
      offset={SMALL_SCREEN_TOAST_OFFSET}
      mobileOffset={SMALL_SCREEN_TOAST_OFFSET}
      closeButton
    />
  );
}
