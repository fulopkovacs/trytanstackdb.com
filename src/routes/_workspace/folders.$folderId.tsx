import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { MacNoteList } from "@/components/notes/mac/note-list";
import { MacPagePane } from "@/components/notes/mac/page-pane";
import { IosPageScreen } from "@/components/notes/ios/page-screen";
import { ByLayout } from "@/components/notes/notes-layout";
import { useFolderView } from "@/db/queries";

export const Route = createFileRoute("/_workspace/folders/$folderId")({
  component: FolderLayout,
});

/** macOS: the note list column stays mounted while the editor column changes. */
function FolderLayout() {
  const { folderId } = Route.useParams();
  const { view, isReady } = useFolderView(folderId);

  if (isReady && !view) return <FolderNotFound />;

  return (
    <ByLayout
      mac={
        <>
          <MacNoteList folderId={folderId} />
          <Outlet />
        </>
      }
      ios={<Outlet />}
    />
  );
}

function FolderNotFound() {
  const message = (
    <p className="pt-10 text-center opacity-60">
      This folder doesn't exist.{" "}
      <Link to="/" className="underline">
        Back to Folders
      </Link>
    </p>
  );
  return (
    <ByLayout
      mac={<MacPagePane title="Folder not found">{message}</MacPagePane>}
      ios={<IosPageScreen title="Not Found">{message}</IosPageScreen>}
    />
  );
}
