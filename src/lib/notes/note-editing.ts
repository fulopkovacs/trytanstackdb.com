import { parseLine } from "./note-body";
import type { NoteBlock } from "./note-body";

/**
 * The editor's text operations as pure functions: the editor shows a title
 * field and one field per body block, and these decide what Enter,
 * Backspace, typing and pasting do to them.
 */

export interface NoteText {
  title: string;
  blocks: NoteBlock[];
}

/** Where the caret goes after an edit. `field` -1 is the title, 0… the body blocks. */
export interface Caret {
  field: number;
  offset: number;
}

export interface NoteTextEdit extends NoteText {
  caret: Caret;
}

const TITLE = -1;

function replaceAt<T>(items: T[], index: number, item: T): T[] {
  return items.map((existing, i) => (i === index ? item : existing));
}

function withText(block: NoteBlock, text: string): NoteBlock {
  return { ...block, text };
}

/** The block a new line after `block` starts as: lists continue, everything else is a paragraph. */
function continuation(block: NoteBlock, text: string): NoteBlock {
  if (block.type === "bullet") return { type: "bullet", text };
  if (block.type === "checklist") return { type: "checklist", text, checked: false };
  return { type: "paragraph", text };
}

function isEmptyBody(blocks: NoteBlock[]): boolean {
  return blocks.length === 1 && blocks[0]!.type === "paragraph" && blocks[0]!.text === "";
}

/** Typing or pasting into the title. Pasted lines after the first go into the body. */
export function setTitle({ blocks }: NoteText, value: string, caretOffset: number): NoteTextEdit {
  const [title = "", ...rest] = value.split("\n");
  if (rest.length === 0) return { title, blocks, caret: { field: TITLE, offset: caretOffset } };
  const pasted = rest.map(parseLine);
  return {
    title,
    blocks: isEmptyBody(blocks) ? pasted : [...pasted, ...blocks],
    caret: { field: pasted.length - 1, offset: pasted.at(-1)!.text.length },
  };
}

/** Typing or pasting into a body block. Pasted lines become blocks of their own. */
export function setBlockText(
  { title, blocks }: NoteText,
  index: number,
  value: string,
  caretOffset: number,
): NoteTextEdit {
  const block = blocks[index]!;
  const [first = "", ...rest] = value.split("\n");
  // Markdown-style shortcuts: "- " starts a bullet, "[ ] " a checklist item, "# " a heading.
  const updated = block.type === "paragraph" ? parseLine(first) : withText(block, first);
  const shortcut = updated.type !== block.type;
  const pasted = rest.map(parseLine);
  return {
    title,
    blocks: [...blocks.slice(0, index), updated, ...pasted, ...blocks.slice(index + 1)],
    caret:
      pasted.length > 0
        ? { field: index + pasted.length, offset: pasted.at(-1)!.text.length }
        : { field: index, offset: shortcut ? updated.text.length : caretOffset },
  };
}

/** Enter in the title: the rest of the title becomes the first body line. */
export function splitTitle({ title, blocks }: NoteText, start: number, end: number): NoteTextEdit {
  const after = title.slice(end);
  const first: NoteBlock = { type: "paragraph", text: after };
  return {
    title: title.slice(0, start),
    blocks: isEmptyBody(blocks) ? [first] : [first, ...blocks],
    caret: { field: 0, offset: 0 },
  };
}

/** Enter in a block: split it at the caret. Enter on an empty list item ends the list. */
export function splitBlock(
  { title, blocks }: NoteText,
  index: number,
  start: number,
  end: number,
): NoteTextEdit {
  const block = blocks[index]!;
  if (block.type !== "paragraph" && block.text === "") {
    const paragraph: NoteBlock = { type: "paragraph", text: "" };
    return {
      title,
      blocks: replaceAt(blocks, index, paragraph),
      caret: { field: index, offset: 0 },
    };
  }
  const before = withText(block, block.text.slice(0, start));
  const after = continuation(block, block.text.slice(end));
  return {
    title,
    blocks: [...blocks.slice(0, index), before, after, ...blocks.slice(index + 1)],
    caret: { field: index + 1, offset: 0 },
  };
}

/**
 * Backspace at the very start of a block: a list item or heading turns into
 * a paragraph first; a paragraph joins the line above (or the title).
 */
export function joinWithPrevious({ title, blocks }: NoteText, index: number): NoteTextEdit {
  const block = blocks[index]!;
  if (block.type !== "paragraph") {
    return {
      title,
      blocks: replaceAt(blocks, index, { type: "paragraph", text: block.text }),
      caret: { field: index, offset: 0 },
    };
  }
  const rest = blocks.filter((_, i) => i !== index);
  const remaining = rest.length > 0 ? rest : [{ type: "paragraph", text: "" } satisfies NoteBlock];
  if (index === 0) {
    return {
      title: title + block.text,
      blocks: remaining,
      caret: { field: TITLE, offset: title.length },
    };
  }
  const previous = blocks[index - 1]!;
  return {
    title,
    blocks: replaceAt(rest, index - 1, withText(previous, previous.text + block.text)),
    caret: { field: index - 1, offset: previous.text.length },
  };
}

/** The checklist button: turn the block into a checklist item, or back into a paragraph. */
export function toggleChecklist({ title, blocks }: NoteText, index: number): NoteTextEdit {
  const block = blocks[index]!;
  const toggled: NoteBlock =
    block.type === "checklist"
      ? { type: "paragraph", text: block.text }
      : { type: "checklist", text: block.text, checked: false };
  return {
    title,
    blocks: replaceAt(blocks, index, toggled),
    caret: { field: index, offset: block.text.length },
  };
}

/** Ticks or unticks a checklist item. */
export function toggleChecked(blocks: NoteBlock[], index: number): NoteBlock[] {
  const block = blocks[index]!;
  return block.type === "checklist"
    ? replaceAt(blocks, index, { ...block, checked: !block.checked })
    : blocks;
}
