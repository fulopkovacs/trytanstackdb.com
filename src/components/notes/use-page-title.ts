import { useLocation, useParams } from "@tanstack/react-router";

import { useFolderView, useNoteInFolder } from "@/db/queries";
import { noteDisplayTitle } from "@/lib/notes/note-body";

/** Title of the current Notes page, shown in the fake browser tab. Live: it follows edits. */
export function usePageTitle(): string {
  const { folderId, noteId } = useParams({ strict: false });
  const pathname = useLocation({ select: (location) => location.pathname });
  const { view: folder } = useFolderView(folderId ?? "");
  const { note } = useNoteInFolder(folderId ?? "", noteId ?? "");

  if (note) return noteDisplayTitle(note.title);
  if (folder) return folder.name;
  if (pathname === "/settings") return "Settings";
  if (pathname === "/analytics") return "Analytics";
  return "Notes";
}
