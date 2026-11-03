import { useEffect } from "react";
import { toast } from "sonner";

import { subscribeToAppActions } from "@/lib/app-actions";
import type { AppAction } from "@/lib/app-actions";

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

/**
 * When the server rejects a change, TanStack DB has already rolled it back;
 * this says so, with the server's reason.
 */
export function useRollbackToasts() {
  useEffect(
    () =>
      subscribeToAppActions((event) => {
        if (event.status !== "rolled-back") return;
        const title = (FAILED[event.type] as ((action: AppAction) => string) | undefined)?.(event);
        toast.error(title ?? "Couldn't save the change", {
          description: `${event.error?.message ?? "The server rejected it."} The change was undone.`,
        });
      }),
    [],
  );
}
