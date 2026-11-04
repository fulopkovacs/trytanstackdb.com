import { useNavigate, useParams } from "@tanstack/react-router";

import { createNote } from "@/db/mutations";
import { useAccount } from "@/db/queries";
import { isSmartFolderId } from "@/lib/notes/folder-views";

import { focusNoteWhenOpened } from "./note-editor";

/**
 * The compose button: a new, empty note in the open folder (or the default
 * folder, from a smart folder), opened with its title focused. `undefined`
 * where Notes doesn't allow it (Recently Deleted).
 */
export function useComposeNote(): (() => void) | undefined {
  const navigate = useNavigate();
  const account = useAccount();
  const { folderId: openFolderId } = useParams({ strict: false });

  if (!account || openFolderId === "recently-deleted") return undefined;

  return () => {
    const folderId =
      openFolderId && !isSmartFolderId(openFolderId) ? openFolderId : account.defaultFolderId;
    const { note } = createNote(folderId);
    focusNoteWhenOpened(note.id);
    // Stay in All iCloud; from anywhere else, go to the folder the note is in.
    const listId = openFolderId === "all" ? "all" : folderId;
    void navigate({
      to: "/folders/$folderId/notes/$noteId",
      params: { folderId: listId, noteId: note.id },
    });
  };
}
