import { Outlet, createFileRoute } from "@tanstack/react-router";

import { NotesApp } from "@/components/notes/notes-app";
import { Workspace } from "@/components/shell/workspace";

export const Route = createFileRoute("/_workspace")({
  // The app measures its pane and uses local time for "Today"/"Yesterday";
  // both only make sense in the browser. TanStack DB is client-only too.
  ssr: false,
  pendingComponent: () => <div className="h-dvh bg-muted dark:bg-[#0c0c0d]" />,
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <Workspace
      app={
        <NotesApp>
          <Outlet />
        </NotesApp>
      }
    />
  );
}
