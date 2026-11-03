import { Link } from "@tanstack/react-router";
import { ChartColumn, Folder, FolderPlus, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { useAccount, useFolders, useNoteCounts } from "@/db/queries";
import type { Folder as FolderRecord } from "@/db/schema";
import { reportAction } from "@/lib/app-actions";
import { isSmartFolderId } from "@/lib/notes/folder-views";
import { cn } from "@/lib/utils";

import { AccountAvatar, QuickNotesIcon, SharedIcon } from "../icons";
import { canRenameFolder, RenameFolderDialog } from "../rename-folder-dialog";
import { useComposeNote } from "../use-compose-note";
import {
  GlassCircle,
  GlassPill,
  InsetCard,
  InsetRow,
  IosScreen,
  LargeTitle,
  RowChevron,
  SearchAndCompose,
  SectionHeader,
} from "./ui";

export function IosFoldersScreen() {
  const folders = useFolders();
  const counts = useNoteCounts();
  const account = useAccount();
  const [iCloudOpen, setICloudOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [renaming, setRenaming] = useState<FolderRecord | null>(null);
  const composeNote = useComposeNote();

  const quickNotes = folders.find((folder) => folder.role === "quick-notes");
  const iCloudFolders = folders.filter((folder) => folder.role !== "quick-notes");

  return (
    <IosScreen
      trailing={
        <>
          <GlassCircle aria-label="New folder">
            <FolderPlus />
          </GlassCircle>
          <GlassPill className={cn("p-0", editing && "bg-notes-accent text-black")}>
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => setEditing((on) => !on)}
              className="h-full rounded-full px-4 text-[17px] font-medium"
            >
              {editing ? "Done" : "Edit"}
            </button>
          </GlassPill>
        </>
      }
      bottom={<SearchAndCompose onCompose={composeNote} />}
    >
      <LargeTitle title="Folders" />

      <InsetCard>
        {quickNotes && (
          <InsetRow first separatorInset={58}>
            <FolderRow
              folderId={quickNotes.id}
              icon={<QuickNotesIcon className="size-[30px] rounded-[8px]" />}
              name={quickNotes.name}
              count={counts[quickNotes.id]}
            />
          </InsetRow>
        )}
        <InsetRow first={!quickNotes} separatorInset={58}>
          <FolderRow
            folderId="shared"
            icon={<SharedIcon className="size-[30px] rounded-[8px]" />}
            name="Shared"
            count={counts.shared}
          />
        </InsetRow>
      </InsetCard>

      <SectionHeader chevron open={iCloudOpen} onToggle={() => setICloudOpen((open) => !open)}>
        iCloud
      </SectionHeader>
      {iCloudOpen && (
        <InsetCard>
          <InsetRow first separatorInset={58}>
            <FolderRow folderId="all" icon={<FolderGlyph />} name="All iCloud" count={counts.all} />
          </InsetRow>
          {iCloudFolders.map((folder) => (
            <InsetRow key={folder.id} separatorInset={58}>
              {editing && canRenameFolder(folder) ? (
                <RenameRow
                  folder={folder}
                  count={counts[folder.id]}
                  onRename={() => setRenaming(folder)}
                />
              ) : (
                <FolderRow
                  folderId={folder.id}
                  icon={<FolderGlyph />}
                  name={folder.name}
                  count={counts[folder.id]}
                />
              )}
            </InsetRow>
          ))}
          <InsetRow separatorInset={58}>
            <FolderRow
              folderId="recently-deleted"
              icon={<Trash className="size-[26px] text-notes-accent" strokeWidth={1.6} />}
              name="Recently Deleted"
              count={counts["recently-deleted"]}
            />
          </InsetRow>
        </InsetCard>
      )}

      <SectionHeader chevron open={false}>
        Tags
      </SectionHeader>

      <SectionHeader>Account</SectionHeader>
      <InsetCard>
        <InsetRow first separatorInset={58}>
          <Link to="/settings" className="flex min-h-[60px] items-center gap-3 px-4 py-2">
            <AccountAvatar name={account?.name ?? ""} className="size-[30px]" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[17px]">{account?.name}</span>
              <span className="block truncate text-[14px] text-ios-secondary">
                {account?.email}
              </span>
            </span>
            <RowChevron />
          </Link>
        </InsetRow>
        <InsetRow separatorInset={58}>
          <Link to="/analytics" className="flex h-[52px] items-center gap-3 px-4">
            <span className="grid w-[30px] place-items-center">
              <ChartColumn className="size-[24px] text-notes-accent" strokeWidth={1.8} />
            </span>
            <span className="flex-1 text-[17px]">Analytics</span>
            <RowChevron />
          </Link>
        </InsetRow>
      </InsetCard>

      <RenameFolderDialog folder={renaming} onOpenChange={(open) => !open && setRenaming(null)} />
    </IosScreen>
  );
}

/** In Edit mode, tapping a folder renames it instead of opening it. */
function RenameRow({
  folder,
  count,
  onRename,
}: {
  folder: FolderRecord;
  count: number | undefined;
  onRename: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRename}
      aria-label={`Rename ${folder.name}`}
      className="flex h-[52px] w-full items-center gap-3 px-4 text-left active:bg-black/5 dark:active:bg-white/5"
    >
      <span className="grid w-[30px] place-items-center">
        <FolderGlyph />
      </span>
      <span className="min-w-0 flex-1 truncate text-[17px]">{folder.name}</span>
      <span className="text-[17px] text-ios-secondary tabular-nums">{count ?? 0}</span>
      <Pencil className="size-[18px] shrink-0 text-notes-accent" strokeWidth={2.2} />
    </button>
  );
}

function FolderRow({
  folderId,
  icon,
  name,
  count,
}: {
  folderId: string;
  icon: ReactNode;
  name: string;
  count: number | undefined;
}) {
  return (
    <Link
      to="/folders/$folderId"
      params={{ folderId }}
      onClick={() =>
        reportAction({ type: "folder.opened", folderId, smart: isSmartFolderId(folderId) })
      }
      className="flex h-[52px] items-center gap-3 px-4 active:bg-black/5 dark:active:bg-white/5"
    >
      <span className="grid w-[30px] place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[17px]">{name}</span>
      <span className="text-[17px] text-ios-secondary tabular-nums">{count ?? 0}</span>
      <RowChevron />
    </Link>
  );
}

function FolderGlyph() {
  return <Folder className="size-[26px] text-notes-accent" strokeWidth={1.6} />;
}
