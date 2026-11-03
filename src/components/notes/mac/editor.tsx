import { useRef } from "react";

import type { Note } from "@/db/schema";
import { formatEditorDate } from "@/lib/notes/dates";

import { DeletedNoteBanner } from "../deleted-note-banner";
import { NoteContent } from "../note-content";
import { NoteEditor } from "../note-editor";
import type { NoteEditorHandle } from "../note-editor";
import { EditorToolbar } from "./editor-toolbar";

export function MacEditor({ note }: { note: Note | undefined }) {
  const editorRef = useRef<NoteEditorHandle>(null);
  const deleted = note?.deletedAt != null;

  return (
    <section aria-label="Editor" className="flex min-w-0 flex-1 flex-col bg-mac-content">
      <EditorToolbar
        note={note}
        onToggleChecklist={
          note && !deleted ? () => editorRef.current?.toggleChecklist() : undefined
        }
      />
      <div
        data-page-scroll
        className="notes-scroll min-h-0 flex-1 overflow-y-auto px-[22px] pb-10 text-mac-text"
      >
        {note ? (
          <>
            {deleted && <DeletedNoteBanner noteId={note.id} variant="mac" />}
            <p className="pt-1 pb-3 text-center text-[12px] text-mac-text-secondary">
              {formatEditorDate(new Date(note.updatedAt))}
            </p>
            {deleted ? (
              <NoteContent note={note} variant="mac" />
            ) : (
              <NoteEditor key={note.id} note={note} variant="mac" handleRef={editorRef} />
            )}
          </>
        ) : (
          <p className="pt-32 text-center text-[13px] text-mac-text-secondary">No note selected</p>
        )}
      </div>
    </section>
  );
}
