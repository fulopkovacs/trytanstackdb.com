import { z } from "zod";

/**
 * The records the API serves. The fixtures, the fake server and the
 * collections all share these schemas, so there's one set of types.
 */

/** Folders with a role get special treatment in the sidebar. */
export const folderRoleSchema = z.enum(["quick-notes", "default"]).nullable();

export const folderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: folderRoleSchema,
  /** Sort order in the sidebar. */
  position: z.number().int(),
  createdAt: z.iso.datetime(),
});

export const noteSchema = z.object({
  id: z.string(),
  folderId: z.string(),
  title: z.string(),
  /**
   * Plain text, one block per line:
   * `# Heading`, `- bullet`, `[ ] todo`, `[x] done`, anything else is a paragraph.
   */
  body: z.string(),
  pinned: z.boolean(),
  shared: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  /** Set when the note is in Recently Deleted. */
  deletedAt: z.iso.datetime().nullable(),
});

export const sortNotesBySchema = z.enum(["dateEdited", "dateCreated", "title"]);
export const newNoteStyleSchema = z.enum(["title", "heading", "body"]);

export const accountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name can't be empty"),
  email: z.email("Enter a valid email address"),
  plan: z.string(),
  storageUsedGb: z.number(),
  storageTotalGb: z.number(),
  defaultFolderId: z.string(),
  sortNotesBy: sortNotesBySchema,
  newNotesStartWith: newNoteStyleSchema,
  groupNotesByDate: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type FolderRole = z.infer<typeof folderRoleSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type Note = z.infer<typeof noteSchema>;
export type SortNotesBy = z.infer<typeof sortNotesBySchema>;
export type NewNoteStyle = z.infer<typeof newNoteStyleSchema>;
export type Account = z.infer<typeof accountSchema>;
