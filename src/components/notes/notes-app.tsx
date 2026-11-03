import type { ReactNode } from "react";

import { MacSidebar } from "./mac/sidebar";
import { NotesLayoutProvider, useNotesLayout } from "./notes-layout";

/**
 * Root of the Notes clone. On macOS the sidebar stays mounted while routes
 * swap the columns next to it; on iPhone each route is a full screen.
 */
export function NotesApp({ children }: { children: ReactNode }) {
  return (
    <NotesLayoutProvider>
      <NotesAppFrame>{children}</NotesAppFrame>
    </NotesLayoutProvider>
  );
}

function NotesAppFrame({ children }: { children: ReactNode }) {
  const { layout, sidebarVisible } = useNotesLayout();

  if (layout === "ios") return <div className="h-full">{children}</div>;

  return (
    <div className="flex h-full bg-mac-content font-sans text-mac-text antialiased">
      {sidebarVisible && <MacSidebar />}
      {children}
    </div>
  );
}
