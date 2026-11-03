import { Check } from "lucide-react";

import type { Note } from "@/fixtures";
import { parseNoteBody } from "@/lib/notes/note-body";
import { cn } from "@/lib/utils";

interface NoteContentProps {
  note: Note;
  /** `mac` uses desktop type sizes, `ios` the larger iPhone ones. */
  variant: "mac" | "ios";
}

/** Renders a note the way the Notes editor does: Title style first line, then blocks. */
export function NoteContent({ note, variant }: NoteContentProps) {
  const blocks = parseNoteBody(note.body);
  const ios = variant === "ios";

  return (
    <div className={cn(ios ? "text-[17px] leading-[1.45]" : "text-[13.5px] leading-[1.5]")}>
      <h1
        className={cn(
          "font-bold tracking-[-0.01em]",
          ios ? "mb-1.5 text-[28px] leading-tight" : "mb-1 text-[22px] leading-tight",
        )}
      >
        {note.title}
      </h1>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className={cn("font-bold", ios ? "mt-3 text-[20px]" : "mt-2.5 text-[17px]")}
              >
                {block.text}
              </h2>
            );
          case "bullet":
            return (
              <p key={index} className="flex gap-2 pl-1">
                <span aria-hidden>•</span>
                <span>{block.text}</span>
              </p>
            );
          case "checklist":
            return (
              <p
                key={index}
                className={cn("flex items-center", ios ? "gap-3 py-1" : "gap-2 py-px")}
              >
                <ChecklistCircle checked={block.checked} large={ios} />
                <span className={cn(block.checked && "text-mac-text-secondary line-through")}>
                  {/* Read-only for now; phase 2 turns these into real, labelled checkboxes. */}
                  <span className="sr-only">{block.checked ? "Done: " : "To do: "}</span>
                  {block.text}
                </span>
              </p>
            );
          case "paragraph":
            return <p key={index}>{block.text}</p>;
        }
      })}
    </div>
  );
}

function ChecklistCircle({ checked, large }: { checked: boolean; large: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        large ? "size-[24px]" : "size-[16px]",
        checked
          ? "bg-notes-accent text-white"
          : "border-[1.5px] border-[#b5b5b8] dark:border-[#5c5c60]",
      )}
    >
      {checked && <Check className="size-[65%]" strokeWidth={3} />}
    </span>
  );
}
