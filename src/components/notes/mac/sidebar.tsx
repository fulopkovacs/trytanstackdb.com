import { Link } from "@tanstack/react-router";
import { ChartColumn, ChevronRight, Folder, Pencil, PanelLeft, Trash } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAccount, useFolders, useNoteCounts } from "@/db/queries";
import type { Folder as FolderRecord } from "@/db/schema";
import { reportAction } from "@/lib/app-actions";
import { isSmartFolderId } from "@/lib/notes/folder-views";

import { AccountAvatar, QuickNotesIcon, SharedIcon } from "../icons";
import { useNotesLayout } from "../notes-layout";
import { canRenameFolder, RenameFolderDialog } from "../rename-folder-dialog";
import { MacCircleButton, MacColumnHeader } from "./controls";

export function SidebarToggle() {
  const { toggleSidebar, sidebarVisible } = useNotesLayout();
  return (
    <MacCircleButton
      aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
      aria-pressed={sidebarVisible}
      onClick={toggleSidebar}
    >
      <PanelLeft />
    </MacCircleButton>
  );
}

export function MacSidebar() {
  const folders = useFolders();
  const counts = useNoteCounts();
  const account = useAccount();
  const [renaming, setRenaming] = useState<FolderRecord | null>(null);

  const quickNotes = folders.find((folder) => folder.role === "quick-notes");
  const iCloudFolders = folders.filter((folder) => folder.role !== "quick-notes");

  return (
    <nav
      aria-label="Folders"
      className="flex w-[208px] shrink-0 flex-col border-r border-mac-column-border bg-mac-sidebar"
    >
      <MacColumnHeader>
        <SidebarToggle />
      </MacColumnHeader>

      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {quickNotes && (
          <SidebarLink
            folderId={quickNotes.id}
            icon={<QuickNotesIcon />}
            label={quickNotes.name}
            count={counts[quickNotes.id]}
          />
        )}
        <SidebarLink folderId="shared" icon={<SharedIcon />} label="Shared" count={counts.shared} />

        <SidebarGroupLabel>iCloud</SidebarGroupLabel>
        <SidebarLink folderId="all" icon={<FolderIcon />} label="All iCloud" count={counts.all} />
        {iCloudFolders.map((folder) => (
          <SidebarLink
            key={folder.id}
            folderId={folder.id}
            icon={<FolderIcon />}
            label={folder.name}
            count={counts[folder.id]}
            onRename={canRenameFolder(folder) ? () => setRenaming(folder) : undefined}
          />
        ))}
        <SidebarLink
          folderId="recently-deleted"
          icon={<Trash className="size-[17px] stroke-[1.5] text-mac-icon" />}
          label="Recently Deleted"
          count={counts["recently-deleted"]}
        />

        <SidebarGroupLabel collapsed>Tags</SidebarGroupLabel>
      </div>

      <RenameFolderDialog folder={renaming} onOpenChange={(open) => !open && setRenaming(null)} />

      <div className="space-y-0.5 border-t border-mac-column-border px-2.5 py-2">
        <Link to="/analytics" className={rowClassName}>
          <ChartColumn className="size-[17px] stroke-[1.5] text-mac-icon" />
          <span className="flex-1 truncate">Analytics</span>
        </Link>
        {account && (
          <Link to="/settings" className={`${rowClassName} h-auto py-1.5`}>
            <AccountAvatar name={account.name} />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate font-medium">{account.name}</span>
              <span className="block truncate text-[11px] text-mac-text-secondary">
                {account.email}
              </span>
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}

const rowClassName =
  "flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-[13px] text-mac-text outline-none focus-visible:ring-2 focus-visible:ring-notes-accent/60 data-[status=active]:bg-mac-folder-selected";

function SidebarLink({
  folderId,
  icon,
  label,
  count,
  onRename,
}: {
  folderId: string;
  icon: ReactNode;
  label: string;
  count: number | undefined;
  /** Renamable folders: double-click or right-click → Rename Folder. */
  onRename?: () => void;
}) {
  const link = (
    <Link
      to="/folders/$folderId"
      params={{ folderId }}
      onClick={() =>
        reportAction({ type: "folder.opened", folderId, smart: isSmartFolderId(folderId) })
      }
      onDoubleClick={onRename}
      className={`${rowClassName} data-[state=open]:ring-2 data-[state=open]:ring-notes-accent/60`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[12px] text-mac-text-secondary tabular-nums">{count ?? 0}</span>
    </Link>
  );
  if (!onRename) return link;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{link}</ContextMenuTrigger>
      {/* Don't hand focus back to the row: the rename dialog takes it. */}
      <ContextMenuContent className="min-w-44" onCloseAutoFocus={(event) => event.preventDefault()}>
        <ContextMenuItem onSelect={onRename}>
          <Pencil />
          Rename Folder…
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SidebarGroupLabel({ children, collapsed }: { children: ReactNode; collapsed?: boolean }) {
  return (
    <div className="group flex items-center px-2 pt-4 pb-1 text-[11px] font-semibold text-mac-text-secondary">
      <span className="flex-1">{children}</span>
      {collapsed && (
        <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}

function FolderIcon() {
  return <Folder className="size-[17px] shrink-0 stroke-[1.5] text-mac-icon" aria-hidden />;
}
