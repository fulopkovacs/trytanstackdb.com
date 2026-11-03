import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAppData } from "@/db/queries";

import { MacSidebar } from "./mac/sidebar";
import { NotesLayoutProvider, useNotesLayout } from "./notes-layout";
import { useRollbackToasts } from "./use-rollback-toasts";

/**
 * Root of the Notes clone. On macOS the sidebar stays mounted while routes
 * swap the columns next to it; on iPhone each route is a full screen. The
 * screens render once the collections have loaded from the API.
 */
export function NotesApp({ children }: { children: ReactNode }) {
  useRollbackToasts();
  return (
    <NotesLayoutProvider>
      <NotesAppFrame>{children}</NotesAppFrame>
    </NotesLayoutProvider>
  );
}

function NotesAppFrame({ children }: { children: ReactNode }) {
  const { layout, sidebarVisible } = useNotesLayout();
  const { status, retry } = useAppData();

  if (status !== "ready") {
    return (
      <div
        className={
          layout === "ios"
            ? "grid h-full place-items-center bg-ios-bg text-ios-secondary"
            : "grid h-full place-items-center bg-mac-content text-mac-text-secondary"
        }
      >
        {status === "loading" ? (
          <p className="flex items-center gap-2 text-[13px]" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Loading notes…
          </p>
        ) : (
          <div className="space-y-3 text-center text-[13px]" role="alert">
            <p>Couldn't load your notes.</p>
            <Button size="sm" variant="outline" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (layout === "ios") return <div className="h-full">{children}</div>;

  return (
    <div className="flex h-full bg-mac-content font-sans text-mac-text antialiased">
      {sidebarVisible && <MacSidebar />}
      {children}
    </div>
  );
}
