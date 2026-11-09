import { Link, useParams } from "@tanstack/react-router";
import { ChevronDown, Ellipsis, Folder } from "lucide-react";
import { useState } from "react";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useFolderView, useNoteList } from "@/db/queries";
import type { NoteListItem } from "@/db/queries";
import { reportAction } from "@/lib/app-actions";
import { formatListDate } from "@/lib/notes/dates";
import { noteDisplayTitle, noteSnippet } from "@/lib/notes/note-body";
import { noteListSections } from "@/lib/notes/note-list";
import { cn } from "@/lib/utils";

import { notesMenuClassName } from "../menu-style";

import { NoteActionItems } from "../note-actions";
import { useNotesLayout } from "../notes-layout";
import { MacCircleButton, MacColumnHeader } from "./controls";
import { SidebarToggle } from "./sidebar";

export function MacNoteList({ folderId }: { folderId: string }) {
  const { view } = useFolderView(folderId);
  const { notes, listOptions } = useNoteList(folderId);
  const { sidebarVisible } = useNotesLayout();
  const { noteId: selectedNoteId } = useParams({ strict: false });
  const [pinnedOpen, setPinnedOpen] = useState(true);

  const now = new Date();
  const { pinned, groups } = noteListSections(notes, now, listOptions);
  const showFolder = view?.showsFolderName ?? false;

  return (
    <section
      aria-label="Notes"
      data-spotlight="note-list"
      className="flex w-[216px] shrink-0 flex-col border-r border-mac-column-border bg-mac-content"
    >
      <MacColumnHeader>
        {!sidebarVisible && <SidebarToggle />}
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="truncate text-[13px] font-semibold text-mac-text">{view?.name}</h2>
          <p className="text-[11px] text-mac-text-secondary">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <MacCircleButton aria-label="View options" notImplemented>
          <Ellipsis />
        </MacCircleButton>
      </MacColumnHeader>

      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto pb-4">
        {notes.length === 0 && (
          <p className="pt-24 text-center text-[13px] text-mac-text-secondary">No Notes</p>
        )}

        {pinned.length > 0 && (
          <div className="pb-1">
            <button
              type="button"
              onClick={() => setPinnedOpen((open) => !open)}
              aria-expanded={pinnedOpen}
              className="mb-2 flex w-full items-center border-b border-mac-separator px-[14px] pt-2.5 pb-2 text-left text-[15px] font-bold text-mac-text"
            >
              <span className="flex-1">Pinned</span>
              <ChevronDown
                className={cn(
                  "size-3.5 text-mac-text-secondary transition-transform",
                  !pinnedOpen && "-rotate-90",
                )}
              />
            </button>
            {pinnedOpen && (
              <NoteRows
                notes={pinned}
                selectedNoteId={selectedNoteId}
                showFolder={showFolder}
                now={now}
              />
            )}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            {group.label ? (
              <h3 className="px-[14px] pt-5 pb-1.5 text-[15px] font-bold text-mac-text">
                {group.label}
              </h3>
            ) : (
              pinned.length > 0 && <div className="h-3" />
            )}
            <NoteRows
              notes={group.items}
              selectedNoteId={selectedNoteId}
              showFolder={showFolder}
              now={now}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function NoteRows({
  notes,
  selectedNoteId,
  showFolder,
  now,
}: {
  notes: NoteListItem[];
  selectedNoteId: string | undefined;
  showFolder: boolean;
  now: Date;
}) {
  return (
    <ul className="px-2">
      {notes.map((note, index) => {
        const selected = note.id === selectedNoteId;
        const previousSelected = notes[index - 1]?.id === selectedNoteId;
        return (
          <li key={note.id} className="relative">
            {index > 0 && !selected && !previousSelected && (
              <span
                aria-hidden
                className="absolute top-0 right-1.5 left-[22px] h-px bg-mac-separator"
              />
            )}
            <NoteRow note={note} selected={selected} showFolder={showFolder} now={now} />
          </li>
        );
      })}
    </ul>
  );
}

function NoteRow({
  note,
  selected,
  showFolder,
  now,
}: {
  note: NoteListItem;
  selected: boolean;
  showFolder: boolean;
  now: Date;
}) {
  const { folderId } = useParams({ strict: false });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          to="/folders/$folderId/notes/$noteId"
          params={{ folderId: folderId ?? note.folderId, noteId: note.id }}
          onClick={() => reportAction({ type: "note.opened", noteId: note.id })}
          aria-current={selected ? "page" : undefined}
          className={cn(
            "block rounded-[8px] px-[14px] py-[9px] text-mac-text outline-none focus-visible:ring-2 focus-visible:ring-notes-accent/60 data-[state=open]:ring-2 data-[state=open]:ring-notes-accent/60",
            selected && "bg-mac-row-selected",
          )}
        >
          <NoteRowText note={note} showFolder={showFolder} now={now} />
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn("min-w-44", notesMenuClassName)}>
        <NoteActionItems note={note} menu="context" />
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NoteRowText({
  note,
  showFolder,
  now,
}: {
  note: NoteListItem;
  showFolder: boolean;
  now: Date;
}) {
  return (
    <>
      <p className="truncate text-[13px] leading-[17px] font-bold">
        {noteDisplayTitle(note.title)}
      </p>
      <p className="flex gap-1.5 text-[12px] leading-[16px]">
        <span className="shrink-0">{formatListDate(new Date(note.updatedAt), now)}</span>
        <span className="truncate text-mac-text-secondary">{noteSnippet(note.body)}</span>
      </p>
      {showFolder && note.folderName && (
        <p className="mt-0.5 flex items-center gap-1 text-[12px] leading-[16px] text-mac-text-secondary">
          <Folder className="size-3 shrink-0" />
          <span className="truncate">{note.folderName}</span>
        </p>
      )}
    </>
  );
}
