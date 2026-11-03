import { Navigate, createFileRoute } from "@tanstack/react-router";

import { IosFoldersScreen } from "@/components/notes/ios/folders-screen";
import { ByLayout } from "@/components/notes/notes-layout";
import { useAccount } from "@/data/notes-data";

export const Route = createFileRoute("/_workspace/")({
  component: FoldersPage,
});

/** iPhone: the Folders screen. macOS: the sidebar is always there, so open the default folder. */
function FoldersPage() {
  const account = useAccount();
  return (
    <ByLayout
      ios={<IosFoldersScreen />}
      mac={
        <Navigate to="/folders/$folderId" params={{ folderId: account.defaultFolderId }} replace />
      }
    />
  );
}
