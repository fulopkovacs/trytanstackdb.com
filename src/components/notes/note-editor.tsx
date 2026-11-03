import { Check } from "lucide-react";
import { useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { ComponentProps, KeyboardEvent, Ref } from "react";

import { useEditNote } from "@/db/mutations";
import type { Note } from "@/db/schema";
import { parseEditableBody, serializeBody } from "@/lib/notes/note-body";
import type { NoteBlock } from "@/lib/notes/note-body";
import {
  joinWithPrevious,
  setBlockText,
  setTitle,
  splitBlock,
  splitTitle,
  toggleChecked,
  toggleChecklist,
} from "@/lib/notes/note-editing";
import type { Caret, NoteTextEdit } from "@/lib/notes/note-editing";
import { cn } from "@/lib/utils";

/** What toolbars outside the editor can do to it. */
export interface NoteEditorHandle {
  /** Turns the line with the caret into a checklist item, or back. */
  toggleChecklist: () => void;
}

interface NoteEditorProps {
  note: Note;
  variant: "mac" | "ios";
  handleRef?: Ref<NoteEditorHandle>;
}

const TITLE = -1;

/** A new note's title gets focus when the note opens. */
let noteToFocus: string | null = null;

export function focusNoteWhenOpened(noteId: string) {
  noteToFocus = noteId;
}

/**
 * The note editor: a title field, then one field per line of the body
 * (paragraphs, headings, bullets, checklist items). Every keystroke is an
 * optimistic update of the note in `notesCollection`, so the list, the
 * folder counts and the tab title follow along as you type. The fields
 * render straight from the collection; the update is synchronous, so the
 * caret stays put.
 */
export function NoteEditor({ note, variant, handleRef }: NoteEditorProps) {
  const editNote = useEditNote(note.id);
  const blocks = parseEditableBody(note.body);
  const fields = useRef(new Map<number, HTMLTextAreaElement>());
  const pendingCaret = useRef<Caret | null>(null);
  const lastFocusedField = useRef(TITLE);
  const ios = variant === "ios";

  function placeCaret({ field, offset }: Caret) {
    const element = fields.current.get(field);
    if (!element) return;
    element.focus();
    element.setSelectionRange(offset, offset);
  }

  // After an edit that moves the caret to another line (Enter, Backspace…).
  useLayoutEffect(() => {
    if (!pendingCaret.current) return;
    placeCaret(pendingCaret.current);
    pendingCaret.current = null;
  });

  useLayoutEffect(() => {
    if (noteToFocus !== note.id) return;
    noteToFocus = null;
    placeCaret({ field: TITLE, offset: note.title.length });
  }, [note.id, note.title.length]);

  /** Saves an edit; `moveCaret` when the caret has to land somewhere new. */
  function apply(edit: NoteTextEdit, moveCaret: boolean) {
    const body = serializeBody(edit.blocks);
    const changes = {
      ...(edit.title !== note.title && { title: edit.title }),
      ...(body !== note.body && { body }),
    };
    if (Object.keys(changes).length === 0) {
      // Nothing to save (e.g. Enter at the end of a new note's title): just move.
      if (moveCaret) placeCaret(edit.caret);
      return;
    }
    // Placed after the re-render that shows the edit.
    if (moveCaret) pendingCaret.current = edit.caret;
    editNote(changes);
  }

  const text = { title: note.title, blocks };

  useImperativeHandle(handleRef, () => ({
    toggleChecklist: () => {
      const field = Math.max(lastFocusedField.current, 0);
      if (field >= blocks.length) return;
      apply(toggleChecklist(text, field), true);
    },
  }));

  function onTitleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    if (event.key === "Enter") {
      event.preventDefault();
      apply(splitTitle(text, selectionStart, selectionEnd), true);
    } else if (event.key === "ArrowDown" && selectionStart === value.length) {
      event.preventDefault();
      placeCaret({ field: 0, offset: 0 });
    }
  }

  function onBlockKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const collapsed = selectionStart === selectionEnd;
    if (event.key === "Enter") {
      event.preventDefault();
      apply(splitBlock(text, index, selectionStart, selectionEnd), true);
    } else if (event.key === "Backspace" && collapsed && selectionStart === 0) {
      event.preventDefault();
      apply(joinWithPrevious(text, index), true);
    } else if (event.key === "ArrowUp" && collapsed && selectionStart === 0) {
      event.preventDefault();
      const previous = index === 0 ? note.title : blocks[index - 1]!.text;
      placeCaret({ field: index - 1, offset: previous.length });
    } else if (event.key === "ArrowDown" && collapsed && selectionEnd === value.length) {
      if (index + 1 >= blocks.length) return;
      event.preventDefault();
      placeCaret({ field: index + 1, offset: 0 });
    }
  }

  const register = (field: number) => (element: HTMLTextAreaElement | null) => {
    if (element) fields.current.set(field, element);
    else fields.current.delete(field);
  };

  return (
    <div
      className={cn(ios ? "text-[17px] leading-[1.45]" : "text-[13.5px] leading-[1.5]")}
      onFocus={(event) => {
        const field = [...fields.current].find(
          ([, element]) => element === (event.target as Element),
        )?.[0];
        if (field !== undefined) lastFocusedField.current = field;
      }}
    >
      <EditorField
        ref={register(TITLE)}
        aria-label="Title"
        placeholder="Title"
        value={note.title}
        onChange={(event) => {
          const { value, selectionStart } = event.currentTarget;
          const edit = setTitle(text, value, selectionStart);
          apply(edit, edit.blocks.length !== blocks.length);
        }}
        onKeyDown={onTitleKeyDown}
        className={cn(
          "font-bold tracking-[-0.01em]",
          ios ? "mb-1.5 text-[28px] leading-tight" : "mb-1 text-[22px] leading-tight",
        )}
      />
      <div role="group" aria-label="Note body">
        {blocks.map((block, index) => (
          <BlockRow
            key={index}
            block={block}
            ios={ios}
            onToggleChecked={() => editNote({ body: serializeBody(toggleChecked(blocks, index)) })}
          >
            <EditorField
              ref={register(index)}
              aria-label={blockLabel(block, index)}
              value={block.text}
              onChange={(event) => {
                const { value, selectionStart } = event.currentTarget;
                const edit = setBlockText(text, index, value, selectionStart);
                const structural =
                  edit.blocks.length !== blocks.length || edit.blocks[index]!.type !== block.type;
                apply(edit, structural);
              }}
              onKeyDown={(event) => onBlockKeyDown(event, index)}
              className={cn(
                block.type === "heading" && cn("font-bold", ios ? "text-[20px]" : "text-[17px]"),
                block.type === "checklist" &&
                  block.checked &&
                  "text-mac-text-secondary line-through",
              )}
            />
          </BlockRow>
        ))}
      </div>
    </div>
  );
}

function blockLabel(block: NoteBlock, index: number): string {
  const kind = { heading: "Heading", paragraph: "Line", bullet: "Bullet", checklist: "To-do" };
  return `${kind[block.type]} ${index + 1}`;
}

function BlockRow({
  block,
  ios,
  onToggleChecked,
  children,
}: {
  block: NoteBlock;
  ios: boolean;
  onToggleChecked: () => void;
  children: React.ReactNode;
}) {
  switch (block.type) {
    case "heading":
      return <div className={ios ? "mt-3" : "mt-2.5"}>{children}</div>;
    case "bullet":
      return (
        <div className="flex gap-2 pl-1">
          <span aria-hidden>•</span>
          {children}
        </div>
      );
    case "checklist":
      return (
        <div className={cn("flex items-start", ios ? "gap-3 py-1" : "gap-2 py-px")}>
          <button
            type="button"
            role="checkbox"
            aria-checked={block.checked}
            aria-label={block.text || "To-do"}
            onClick={onToggleChecked}
            className={cn(
              "grid shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-notes-accent/60",
              ios ? "mt-[1px] size-[24px]" : "mt-[2px] size-[16px]",
              block.checked
                ? "bg-notes-accent text-white"
                : "border-[1.5px] border-[#b5b5b8] dark:border-[#5c5c60]",
            )}
          >
            {block.checked && <Check className="size-[65%]" strokeWidth={3} />}
          </button>
          {children}
        </div>
      );
    case "paragraph":
      return children;
  }
}

/**
 * A borderless textarea that grows with its text, so a long line wraps
 * like the rest of the note instead of scrolling.
 */
function EditorField({ className, value, ref, ...props }: ComponentProps<"textarea">) {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const fit = () => {
      element.style.height = "0px";
      element.style.height = `${element.scrollHeight}px`;
    };
    fit();
    let width = element.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (element.offsetWidth === width) return;
      width = element.offsetWidth;
      fit();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <textarea
      ref={(element) => {
        innerRef.current = element;
        if (typeof ref === "function") return ref(element);
        if (ref) ref.current = element;
      }}
      rows={1}
      spellCheck
      value={value}
      className={cn(
        "block w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-mac-text-secondary/70",
        className,
      )}
      {...props}
    />
  );
}
