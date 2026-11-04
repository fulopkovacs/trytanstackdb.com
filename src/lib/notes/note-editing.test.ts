import { describe, expect, it } from "vite-plus/test";

import { parseEditableBody, serializeBody } from "./note-body";
import {
  joinWithPrevious,
  setBlockText,
  setTitle,
  splitBlock,
  splitTitle,
  toggleChecked,
  toggleChecklist,
} from "./note-editing";
import type { NoteText } from "./note-editing";

const note = (title: string, body: string): NoteText => ({
  title,
  blocks: parseEditableBody(body),
});
const body = (edit: NoteText) => serializeBody(edit.blocks);

describe("editable body", () => {
  it("round-trips the stored text, blank lines included", () => {
    const text = "Intro\n\n# Goals\n- one\n[ ] todo\n[x] done\n";
    expect(serializeBody(parseEditableBody(text))).toBe(text);
    expect(parseEditableBody("")).toEqual([{ type: "paragraph", text: "" }]);
  });
});

describe("Enter", () => {
  it("in the title moves the rest of it into the body", () => {
    const edit = splitTitle(note("Groceries list", "Milk"), 9, 9);
    expect(edit.title).toBe("Groceries");
    expect(body(edit)).toBe(" list\nMilk");
    expect(edit.caret).toEqual({ field: 0, offset: 0 });
  });

  it("at the end of a new note's title starts the body", () => {
    const edit = splitTitle(note("Hello", ""), 5, 5);
    expect(edit.title).toBe("Hello");
    expect(body(edit)).toBe("");
    expect(edit.caret).toEqual({ field: 0, offset: 0 });
  });

  it("continues checklists and bullets with an empty item", () => {
    expect(body(splitBlock(note("", "[x] Eggs"), 0, 4, 4))).toBe("[x] Eggs\n[ ] ");
    expect(body(splitBlock(note("", "- ab"), 0, 1, 1))).toBe("- a\n- b");
  });

  it("on an empty list item ends the list", () => {
    const edit = splitBlock(note("", "[ ] Eggs\n[ ] "), 1, 0, 0);
    expect(body(edit)).toBe("[ ] Eggs\n");
    expect(edit.caret).toEqual({ field: 1, offset: 0 });
  });

  it("after a heading starts a paragraph", () => {
    expect(body(splitBlock(note("", "# Goals"), 0, 5, 5))).toBe("# Goals\n");
  });
});

describe("Backspace at the start of a line", () => {
  it("turns a list item into a paragraph first", () => {
    expect(body(joinWithPrevious(note("", "Milk\n[ ] Eggs"), 1))).toBe("Milk\nEggs");
  });

  it("joins a paragraph to the line above", () => {
    const edit = joinWithPrevious(note("", "[ ] Milk\nshake"), 1);
    expect(body(edit)).toBe("[ ] Milkshake");
    expect(edit.caret).toEqual({ field: 0, offset: 4 });
  });

  it("joins the first line to the title", () => {
    const edit = joinWithPrevious(note("Shopping", " list\nMilk"), 0);
    expect(edit.title).toBe("Shopping list");
    expect(body(edit)).toBe("Milk");
    expect(edit.caret).toEqual({ field: -1, offset: 8 });
  });
});

describe("typing and pasting", () => {
  it("keeps the caret where the browser put it", () => {
    const edit = setBlockText(note("", "Mlk"), 0, "Milk", 2);
    expect(body(edit)).toBe("Milk");
    expect(edit.caret).toEqual({ field: 0, offset: 2 });
  });

  it("turns markdown shortcuts into blocks", () => {
    expect(setBlockText(note("", ""), 0, "- ", 2).blocks[0]).toEqual({ type: "bullet", text: "" });
    expect(setBlockText(note("", ""), 0, "[ ] ", 4).blocks[0]).toMatchObject({
      type: "checklist",
    });
  });

  it("splits pasted lines into blocks", () => {
    const edit = setBlockText(note("", "Intro\nEnd"), 0, "Intro\n- a\n[ ] b", 15);
    expect(body(edit)).toBe("Intro\n- a\n[ ] b\nEnd");
    expect(edit.caret).toEqual({ field: 2, offset: 1 });
  });

  it("moves extra lines pasted into the title into the body", () => {
    const edit = setTitle(note("", ""), "Title\nfirst line", 16);
    expect(edit.title).toBe("Title");
    expect(body(edit)).toBe("first line");
  });
});

describe("checklists", () => {
  it("toggle a line in and out of a checklist", () => {
    const once = toggleChecklist(note("", "Eggs"), 0);
    expect(body(once)).toBe("[ ] Eggs");
    expect(body(toggleChecklist(once, 0))).toBe("Eggs");
  });

  it("tick and untick items", () => {
    expect(serializeBody(toggleChecked(parseEditableBody("[ ] Eggs"), 0))).toBe("[x] Eggs");
    expect(serializeBody(toggleChecked(parseEditableBody("Eggs"), 0))).toBe("Eggs");
  });
});
