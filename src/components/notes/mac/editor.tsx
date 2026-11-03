import type { Note } from "@/fixtures";
import { formatEditorDate } from "@/lib/notes/dates";

import { NoteContent } from "../note-content";
import { EditorToolbar } from "./editor-toolbar";

export function MacEditor({ note }: { note: Note | undefined }) {
  return (
    <section aria-label="Editor" className="flex min-w-0 flex-1 flex-col bg-mac-content">
      <EditorToolbar />
      <div
        data-page-scroll
        className="notes-scroll min-h-0 flex-1 overflow-y-auto px-[22px] pb-10 text-mac-text"
      >
        {note ? (
          <>
            <p className="pt-1 pb-3 text-center text-[12px] text-mac-text-secondary">
              {formatEditorDate(new Date(note.updatedAt))}
            </p>
            <NoteContent note={note} variant="mac" />
          </>
        ) : (
          <p className="pt-32 text-center text-[13px] text-mac-text-secondary">No note selected</p>
        )}
      </div>
    </section>
  );
}
