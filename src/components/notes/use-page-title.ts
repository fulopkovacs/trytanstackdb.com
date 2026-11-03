import { useLocation, useParams } from "@tanstack/react-router";

import { useFolderView, useNoteInFolder } from "@/data/notes-data";

/** Title of the current Notes page, shown in the fake browser tab. */
export function usePageTitle(): string {
  const { folderId, noteId } = useParams({ strict: false });
  const pathname = useLocation({ select: (location) => location.pathname });
  const folder = useFolderView(folderId ?? "");
  const note = useNoteInFolder(folderId ?? "", noteId ?? "");

  if (note) return note.title;
  if (folder) return folder.name;
  if (pathname === "/settings") return "Settings";
  if (pathname === "/analytics") return "Analytics";
  return "Notes";
}
