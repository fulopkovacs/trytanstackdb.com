import { expect, test } from "vite-plus/test";

import { countWords, noteSnippet, parseNoteBody } from "./note-body";

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

test("countWords counts what the editor shows, not the block markers", () => {
  const body = "[ ] Buy milk\n[x] Call Sam\n# Plans\n- Bread";
  // Buy, milk, Call, Sam, Plans, Bread
  expect(countWords({ title: "", body })).toBe(6);
  // Weekend, shopping + the 6 above
  expect(countWords({ title: "Weekend shopping", body })).toBe(8);
  // A paragraph, extra spaces and blank lines
  expect(countWords({ title: "  Ideas ", body: "one  two\n\n\nthree" })).toBe(4);
});

test("countWords of an empty note is 0", () => {
  expect(countWords({ title: "", body: "" })).toBe(0);
  expect(countWords({ title: " ", body: "\n\n" })).toBe(0);
  // Markers alone (an empty heading, bullet or to-do) aren't words.
  expect(countWords({ title: "", body: "# \n- \n[ ] \n[x] " })).toBe(0);
});
