import type { Folder, Note } from "@/fixtures";

/**
 * Smart folders aren't stored anywhere: each one is just a filter over notes.
 * In phase 2 every one of these becomes a live query.
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

export function noteMatchesView(note: Note, folderId: string): boolean {
  if (folderId === "recently-deleted") return note.deletedAt !== null;
  if (note.deletedAt !== null) return false;
  if (folderId === "all") return true;
  if (folderId === "shared") return note.shared;
  return note.folderId === folderId;
}

export function byUpdatedAtDesc(a: Note, b: Note): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}
