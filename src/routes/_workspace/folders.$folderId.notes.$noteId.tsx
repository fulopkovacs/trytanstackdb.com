import { Navigate, createFileRoute } from "@tanstack/react-router";

import { MacEditor } from "@/components/notes/mac/editor";
import { IosEditorScreen } from "@/components/notes/ios/editor-screen";
import { ByLayout } from "@/components/notes/notes-layout";
import { useNoteInFolder } from "@/db/queries";

export const Route = createFileRoute("/_workspace/folders/$folderId/notes/$noteId")({
  component: NotePage,
});

function NotePage() {
  const { folderId, noteId } = Route.useParams();
  const { note, isReady } = useNoteInFolder(folderId, noteId);

  return (
    <ByLayout
      mac={
        note || !isReady ? (
          <MacEditor note={note} />
        ) : (
          // Not in this folder (bad link, or moved/deleted): select another note,
          // the way Notes does when the open note disappears.
          <Navigate to="/folders/$folderId" params={{ folderId }} replace />
        )
      }
      ios={<IosEditorScreen folderId={folderId} note={note} />}
    />
  );
}
