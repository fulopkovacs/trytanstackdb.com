export type NoteBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "checklist"; text: string; checked: boolean };

/** Turns a note body (one block per line) into renderable blocks. */
export function parseNoteBody(body: string): NoteBlock[] {
  return body
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line): NoteBlock => {
      if (line.startsWith("# ")) return { type: "heading", text: line.slice(2) };
      if (line.startsWith("- ")) return { type: "bullet", text: line.slice(2) };
      if (line.startsWith("[ ] "))
        return { type: "checklist", text: line.slice(4), checked: false };
      if (line.startsWith("[x] ")) return { type: "checklist", text: line.slice(4), checked: true };
      return { type: "paragraph", text: line };
    });
}

/** The grey preview text shown under a note's title in the list. */
export function noteSnippet(body: string): string {
  const [first] = parseNoteBody(body);
  return first?.text ?? "No additional text";
}
