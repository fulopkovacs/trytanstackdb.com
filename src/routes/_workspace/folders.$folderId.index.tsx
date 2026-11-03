import { Navigate, createFileRoute } from "@tanstack/react-router";

import { MacEditor } from "@/components/notes/mac/editor";
import { IosNoteListScreen } from "@/components/notes/ios/note-list-screen";
import { ByLayout } from "@/components/notes/notes-layout";
import { useNotesInFolder } from "@/data/notes-data";
import { notesInDisplayOrder } from "@/lib/notes/note-list";

export const Route = createFileRoute("/_workspace/folders/$folderId/")({
  component: FolderIndexPage,
});

/**
 * iPhone: the note list screen. macOS: the list is already on screen, and
 * Notes always has a note open, so open the first one.
 */
function FolderIndexPage() {
  const { folderId } = Route.useParams();
  const notes = useNotesInFolder(folderId);
  const [firstNote] = notesInDisplayOrder(notes);

  return (
    <ByLayout
      ios={<IosNoteListScreen folderId={folderId} />}
      mac={
        firstNote ? (
          <Navigate
            to="/folders/$folderId/notes/$noteId"
            params={{ folderId, noteId: firstNote.id }}
            replace
          />
        ) : (
          <MacEditor note={undefined} />
        )
      }
    />
  );
}
