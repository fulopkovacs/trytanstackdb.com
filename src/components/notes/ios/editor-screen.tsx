import { useNavigate } from "@tanstack/react-router";
import { Check, Ellipsis, ListChecks, Paperclip, PenTool, Share } from "lucide-react";
import { useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/db/schema";

import { DeletedNoteBanner } from "../deleted-note-banner";
import { NoteActionItems } from "../note-actions";
import { NoteContent } from "../note-content";
import { NoteEditor } from "../note-editor";
import type { NoteEditorHandle } from "../note-editor";
import { useComposeNote } from "../use-compose-note";
import {
  BackLink,
  ComposeButton,
  GlassCircle,
  GlassPill,
  GlassPillButton,
  IosScreen,
  usePopTo,
} from "./ui";

export function IosEditorScreen({ folderId, note }: { folderId: string; note: Note | undefined }) {
  const editorRef = useRef<NoteEditorHandle>(null);
  const [editing, setEditing] = useState(false);
  const composeNote = useComposeNote();
  const backToList = useBackToList(folderId);
  const deleted = note?.deletedAt != null;

  return (
    <IosScreen
      background="plain"
      leading={<BackLink to="/folders/$folderId" params={{ folderId }} aria-label="Back to list" />}
      trailing={
        <>
          <GlassPill>
            <GlassPillButton aria-label="Share">
              <Share />
            </GlassPillButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <GlassPillButton aria-label="Note actions" disabled={!note}>
                  <Ellipsis />
                </GlassPillButton>
              </DropdownMenuTrigger>
              {note && (
                <DropdownMenuContent align="end" className="min-w-52">
                  <NoteActionItems note={note} menu="dropdown" onRemovedFromView={backToList} />
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </GlassPill>
          {editing && (
            // iOS shows a yellow ✓ while you type; it closes the keyboard.
            <GlassCircle
              aria-label="Done"
              onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
              className="border-transparent bg-notes-accent text-black"
            >
              <Check strokeWidth={2.6} />
            </GlassCircle>
          )}
        </>
      }
      bottom={
        <>
          <GlassPill className="h-12 gap-1 px-3">
            <GlassPillButton
              aria-label="Checklist"
              disabled={!note || deleted}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editorRef.current?.toggleChecklist()}
              className="disabled:opacity-40"
            >
              <ListChecks />
            </GlassPillButton>
            <GlassPillButton aria-label="Attach">
              <Paperclip />
            </GlassPillButton>
            <GlassPillButton aria-label="Markup">
              <PenTool />
            </GlassPillButton>
          </GlassPill>
          <span className="flex-1" />
          <ComposeButton onCompose={composeNote} />
        </>
      }
    >
      <div
        className="px-2 pt-1"
        onFocus={() => setEditing(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false);
        }}
      >
        {!note ? (
          <p className="pt-16 text-center text-[17px] text-ios-secondary">Note not found</p>
        ) : deleted ? (
          <>
            <DeletedNoteBanner noteId={note.id} variant="ios" onRestored={backToList} />
            <NoteContent note={note} variant="ios" />
          </>
        ) : (
          <NoteEditor key={note.id} note={note} variant="ios" handleRef={editorRef} />
        )}
      </div>
    </IosScreen>
  );
}

/** After the note leaves this folder (deleted, moved), go back to the list, like Notes does. */
function useBackToList(folderId: string) {
  const navigate = useNavigate();
  const popTo = usePopTo();
  return () => {
    if (popTo(`/folders/${encodeURIComponent(folderId)}`)) return;
    void navigate({ to: "/folders/$folderId", params: { folderId }, replace: true });
  };
}
