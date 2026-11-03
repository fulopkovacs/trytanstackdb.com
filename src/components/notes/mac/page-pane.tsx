import type { ReactNode } from "react";

import { useNotesLayout } from "../notes-layout";
import { MacColumnHeader } from "./controls";
import { SidebarToggle } from "./sidebar";

/** A full-width pane next to the sidebar, for pages that aren't notes (settings, analytics). */
export function MacPagePane({ title, children }: { title: string; children: ReactNode }) {
  const { sidebarVisible } = useNotesLayout();
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-1 flex-col bg-mac-content text-mac-text"
    >
      <MacColumnHeader className="border-b border-mac-column-border">
        {!sidebarVisible && <SidebarToggle />}
        <h1 className="px-1 text-[15px] font-semibold">{title}</h1>
      </MacColumnHeader>
      <div data-page-scroll className="notes-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-6 py-6">{children}</div>
      </div>
    </section>
  );
}
