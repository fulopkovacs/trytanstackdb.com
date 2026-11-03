import { expect, test } from "vite-plus/test";

import { noteSnippet, parseNoteBody } from "./note-body";

test("parseNoteBody", () => {
  expect(parseNoteBody("Intro\n# Goals\n- one\n[ ] todo\n[x] done\n\n")).toEqual([
    { type: "paragraph", text: "Intro" },
    { type: "heading", text: "Goals" },
    { type: "bullet", text: "one" },
    { type: "checklist", text: "todo", checked: false },
    { type: "checklist", text: "done", checked: true },
  ]);
});

test("noteSnippet uses the first block without its marker", () => {
  expect(noteSnippet("[ ] Passport\n[ ] Chargers")).toBe("Passport");
  expect(noteSnippet("")).toBe("No additional text");
});
