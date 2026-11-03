import { Ellipsis, ListChecks, Paperclip, PenTool, Share } from "lucide-react";

import type { Note } from "@/fixtures";

import { NoteContent } from "../note-content";
import { BackLink, ComposeButton, GlassPill, GlassPillButton, IosScreen } from "./ui";

export function IosEditorScreen({ folderId, note }: { folderId: string; note: Note | undefined }) {
  return (
    <IosScreen
      background="plain"
      leading={<BackLink to="/folders/$folderId" params={{ folderId }} aria-label="Back to list" />}
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
      bottom={
        <>
          <GlassPill className="h-12 gap-1 px-3">
            <GlassPillButton aria-label="Checklist">
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
          <ComposeButton />
        </>
      }
    >
      <div className="px-2 pt-1">
        {note ? (
          <NoteContent note={note} variant="ios" />
        ) : (
          <p className="pt-16 text-center text-[17px] text-ios-secondary">Note not found</p>
        )}
      </div>
    </IosScreen>
  );
}
