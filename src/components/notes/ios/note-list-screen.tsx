import { Link } from "@tanstack/react-router";
import { Ellipsis, Folder, Share } from "lucide-react";
import { useState } from "react";

import { useFolders, useFolderView, useNotesInFolder } from "@/data/notes-data";
import type { Note } from "@/fixtures";
import { formatListDate } from "@/lib/notes/dates";
import { noteSnippet } from "@/lib/notes/note-body";
import { noteListSections } from "@/lib/notes/note-list";

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
  const view = useFolderView(folderId);
  const notes = useNotesInFolder(folderId);
  const [pinnedOpen, setPinnedOpen] = useState(true);

  const now = new Date();
  const { pinned, groups } = noteListSections(notes, now);
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
      bottom={<SearchAndCompose />}
    >
      <LargeTitle
        title={view?.name ?? "Notes"}
        subtitle={`${notes.length} ${notes.length === 1 ? "Note" : "Notes"}`}
      />

      {notes.length === 0 && (
        <p className="pt-16 text-center text-[17px] text-ios-secondary">No Notes</p>
      )}

      {pinned.length > 0 && (
        <>
          <SectionHeader chevron open={pinnedOpen} onToggle={() => setPinnedOpen((open) => !open)}>
            Pinned
          </SectionHeader>
          {pinnedOpen && (
            <NoteCard notes={pinned} folderId={folderId} showFolder={showFolder} now={now} />
          )}
        </>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <SectionHeader>{group.label}</SectionHeader>
          <NoteCard notes={group.items} folderId={folderId} showFolder={showFolder} now={now} />
        </div>
      ))}
    </IosScreen>
  );
}

function NoteCard({
  notes,
  folderId,
  showFolder,
  now,
}: {
  notes: Note[];
  folderId: string;
  showFolder: boolean;
  now: Date;
}) {
  const folders = useFolders();
  return (
    <InsetCard>
      {notes.map((note, index) => {
        const folderName = folders.find((folder) => folder.id === note.folderId)?.name;
        return (
          <InsetRow key={note.id} first={index === 0} separatorInset={26}>
            <Link
              to="/folders/$folderId/notes/$noteId"
              params={{ folderId, noteId: note.id }}
              className="block px-[26px] py-[11px] active:bg-black/5 dark:active:bg-white/5"
            >
              <p className="truncate text-[17px] leading-snug font-semibold">{note.title}</p>
              <p className="flex gap-2 text-[15px] leading-snug text-ios-secondary">
                <span className="shrink-0">{formatListDate(new Date(note.updatedAt), now)}</span>
                <span className="truncate">{noteSnippet(note.body)}</span>
              </p>
              {showFolder && folderName && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[15px] leading-snug text-ios-secondary">
                  <Folder className="size-4 shrink-0" />
                  <span className="truncate">{folderName}</span>
                </p>
              )}
            </Link>
          </InsetRow>
        );
      })}
    </InsetCard>
  );
}
