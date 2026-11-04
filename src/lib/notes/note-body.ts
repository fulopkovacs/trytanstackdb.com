/**
 * A note body is plain text, one block per line:
 * `# Heading`, `- bullet`, `[ ] todo`, `[x] done`, anything else is a paragraph.
 */
export type NoteBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "checklist"; text: string; checked: boolean };

export function parseLine(line: string): NoteBlock {
  if (line.startsWith("# ")) return { type: "heading", text: line.slice(2) };
  if (line.startsWith("- ")) return { type: "bullet", text: line.slice(2) };
  if (line.startsWith("[ ] ")) return { type: "checklist", text: line.slice(4), checked: false };
  if (line.startsWith("[x] ")) return { type: "checklist", text: line.slice(4), checked: true };
  return { type: "paragraph", text: line };
}

export function serializeBlock(block: NoteBlock): string {
  switch (block.type) {
    case "heading":
      return `# ${block.text}`;
    case "bullet":
      return `- ${block.text}`;
    case "checklist":
      return `${block.checked ? "[x]" : "[ ]"} ${block.text}`;
    case "paragraph":
      return block.text;
  }
}

/** Blocks to render (blank lines skipped). */
export function parseNoteBody(body: string): NoteBlock[] {
  return body
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(parseLine);
}

/**
 * Blocks to edit: every line, blank ones included, so the editor round-trips
 * the text exactly. An empty body is one empty paragraph to type into.
 */
export function parseEditableBody(body: string): NoteBlock[] {
  return body.split("\n").map(parseLine);
}

export function serializeBody(blocks: NoteBlock[]): string {
  return blocks.map(serializeBlock).join("\n");
}

function wordsIn(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Words in a note as the editor shows it: the title, then each block's text.
 * Block markers (`# `, `- `, `[ ] `, `[x] `) aren't words.
 */
export function countWords(note: { title: string; body: string }): number {
  return parseNoteBody(note.body).reduce(
    (total, block) => total + wordsIn(block.text),
    wordsIn(note.title),
  );
}

/** The grey preview text shown under a note's title in the list. */
export function noteSnippet(body: string): string {
  const [first] = parseNoteBody(body);
  return first?.text ?? "No additional text";
}

/** What the list and the tab show for a note without a title. */
export const UNTITLED_NOTE = "New Note";

export function noteDisplayTitle(title: string): string {
  return title.trim() === "" ? UNTITLED_NOTE : title;
}
