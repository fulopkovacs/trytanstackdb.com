import type { Folder } from "@/db/schema";

/**
 * Smart folders aren't stored anywhere: each one is just a filter over notes
 * (see `inFolder` in `db/queries.ts`).
 */
export const SMART_FOLDERS = {
  all: { name: "All iCloud" },
  shared: { name: "Shared" },
  "recently-deleted": { name: "Recently Deleted" },
} as const;

export type SmartFolderId = keyof typeof SMART_FOLDERS;

export interface FolderView {
  id: string;
  name: string;
  kind: "folder" | "smart";
  /** Cross-folder views show which folder each note lives in. */
  showsFolderName: boolean;
}

export function isSmartFolderId(id: string): id is SmartFolderId {
  return id in SMART_FOLDERS;
}

export function resolveFolderView(folderId: string, folders: Folder[]): FolderView | undefined {
  if (isSmartFolderId(folderId)) {
    return {
      id: folderId,
      name: SMART_FOLDERS[folderId].name,
      kind: "smart",
      showsFolderName: true,
    };
  }
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return undefined;
  return { id: folder.id, name: folder.name, kind: "folder", showsFolderName: false };
}
