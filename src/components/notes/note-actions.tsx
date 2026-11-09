import { Folder, FolderInput, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";

import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteNote,
  deleteNotePermanently,
  moveNote,
  restoreNote,
  setNotePinned,
} from "@/db/mutations";
import { useFolders } from "@/db/queries";
import type { Note } from "@/db/schema";
import { cn } from "@/lib/utils";

import { notesMenuClassName } from "./menu-style";

/** The same items work in a right-click menu and in a "•••" dropdown. */
const MENU_PARTS = {
  context: {
    Item: ContextMenuItem,
    Separator: ContextMenuSeparator,
    Sub: ContextMenuSub,
    SubTrigger: ContextMenuSubTrigger,
    SubContent: ContextMenuSubContent,
  },
  dropdown: {
    Item: DropdownMenuItem,
    Separator: DropdownMenuSeparator,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
  },
};

interface NoteActionItemsProps {
  note: Pick<Note, "id" | "folderId" | "pinned" | "deletedAt">;
  menu: keyof typeof MENU_PARTS;
  /** Called after an action that takes the note out of the folder on screen. */
  onRemovedFromView?: () => void;
}

/** Pin, move and delete (or recover) a note. */
export function NoteActionItems({ note, menu, onRemovedFromView }: NoteActionItemsProps) {
  const { Item, Separator, Sub, SubTrigger, SubContent } = MENU_PARTS[menu];
  const folders = useFolders();
  const deleted = note.deletedAt !== null;
  const moveTargets = deleted ? folders : folders.filter((folder) => folder.id !== note.folderId);

  return (
    <>
      {!deleted && (
        <Item onSelect={() => setNotePinned(note.id, !note.pinned)}>
          {note.pinned ? <PinOff /> : <Pin />}
          {note.pinned ? "Unpin Note" : "Pin Note"}
        </Item>
      )}
      {deleted && (
        <Item
          onSelect={() => {
            restoreNote(note.id);
            onRemovedFromView?.();
          }}
        >
          <RotateCcw />
          Recover
        </Item>
      )}
      <Sub>
        <SubTrigger>
          <FolderInput />
          Move to
        </SubTrigger>
        <SubContent className={cn("max-h-72 overflow-y-auto", notesMenuClassName)}>
          {moveTargets.map((folder) => (
            <Item
              key={folder.id}
              onSelect={() => {
                moveNote(note.id, folder.id);
                onRemovedFromView?.();
              }}
            >
              <Folder />
              {folder.name}
            </Item>
          ))}
        </SubContent>
      </Sub>
      <Separator />
      <Item
        variant="destructive"
        onSelect={() => {
          if (deleted) deleteNotePermanently(note.id);
          else deleteNote(note.id);
          onRemovedFromView?.();
        }}
      >
        <Trash2 />
        {deleted ? "Delete Permanently" : "Delete"}
      </Item>
    </>
  );
}
