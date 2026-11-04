import { Link } from "@tanstack/react-router";
import { Ellipsis, Folder, Share } from "lucide-react";
import { useState } from "react";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useFolderView, useNoteList } from "@/db/queries";
import type { NoteListItem } from "@/db/queries";
import { reportAction } from "@/lib/app-actions";
import { formatListDate } from "@/lib/notes/dates";
import { noteDisplayTitle, noteSnippet } from "@/lib/notes/note-body";
import { noteListSections } from "@/lib/notes/note-list";

import { NoteActionItems } from "../note-actions";
import { useComposeNote } from "../use-compose-note";

import {
  BackLink,
  GlassPill,
  GlassPillButton,
  InsetCard,
  InsetRow,
  IosScreen,
  LargeTitle,
  SearchAndCompose,
  SectionHeader,
} from "./ui";

export function IosNoteListScreen({ folderId }: { folderId: string }) {
  const { view } = useFolderView(folderId);
  const { notes, listOptions } = useNoteList(folderId);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const composeNote = useComposeNote();

  const now = new Date();
  const { pinned, groups } = noteListSections(notes, now, listOptions);
  const showFolder = view?.showsFolderName ?? false;

  return (
    <IosScreen
      leading={<BackLink to="/" aria-label="Folders" />}
      trailing={
        <GlassPill>
          <GlassPillButton aria-label="Share">
            <Share />
          </GlassPillButton>
          <GlassPillButton aria-label="More">
            <Ellipsis />
          </GlassPillButton>
        </GlassPill>
      }
      bottom={<SearchAndCompose onCompose={composeNote} />}
    >
      <LargeTitle
        title={view?.name ?? "Notes"}
        subtitle={`${notes.length} ${notes.length === 1 ? "Note" : "Notes"}`}
      />

      {notes.length === 0 && (
        <p className="pt-16 text-center text-[17px] text-ios-secondary">No Notes</p>
      )}

      <div data-spotlight="note-list">
        {pinned.length > 0 && (
          <>
            <SectionHeader
              chevron
              open={pinnedOpen}
              onToggle={() => setPinnedOpen((open) => !open)}
            >
              Pinned
            </SectionHeader>
            {pinnedOpen && (
              <NoteCard notes={pinned} folderId={folderId} showFolder={showFolder} now={now} />
            )}
          </>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            {group.label ? <SectionHeader>{group.label}</SectionHeader> : <div className="h-5" />}
            <NoteCard notes={group.items} folderId={folderId} showFolder={showFolder} now={now} />
          </div>
        ))}
      </div>
    </IosScreen>
  );
}

function NoteCard({
  notes,
  folderId,
  showFolder,
  now,
}: {
  notes: NoteListItem[];
  folderId: string;
  showFolder: boolean;
  now: Date;
}) {
  return (
    <InsetCard>
      {notes.map((note, index) => (
        <InsetRow key={note.id} first={index === 0} separatorInset={26}>
          {/* Long-press for the note's actions, like in Notes. */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <Link
                to="/folders/$folderId/notes/$noteId"
                params={{ folderId, noteId: note.id }}
                onClick={() => reportAction({ type: "note.opened", noteId: note.id })}
                className="block px-[26px] py-[11px] select-none [-webkit-touch-callout:none] active:bg-black/5 data-[state=open]:bg-black/5 dark:active:bg-white/5 dark:data-[state=open]:bg-white/5"
              >
                <NoteRowText note={note} showFolder={showFolder} now={now} />
              </Link>
            </ContextMenuTrigger>
            <ContextMenuContent className="min-w-48">
              <NoteActionItems note={note} menu="context" />
            </ContextMenuContent>
          </ContextMenu>
        </InsetRow>
      ))}
    </InsetCard>
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
      <p className="truncate text-[17px] leading-snug font-semibold">
        {noteDisplayTitle(note.title)}
      </p>
      <p className="flex gap-2 text-[15px] leading-snug text-ios-secondary">
        <span className="shrink-0">{formatListDate(new Date(note.updatedAt), now)}</span>
        <span className="truncate">{noteSnippet(note.body)}</span>
      </p>
      {showFolder && note.folderName && (
        <p className="mt-0.5 flex items-center gap-1.5 text-[15px] leading-snug text-ios-secondary">
          <Folder className="size-4 shrink-0" />
          <span className="truncate">{note.folderName}</span>
        </p>
      )}
    </>
  );
}
