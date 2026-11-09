import { highlight } from "sugar-high";
import { describe, expect, it } from "vite-plus/test";

import { withLineIndents } from "./code-lines";

function indentsOf(html: string): string[] {
  return [...html.matchAll(/--indent:(\d+)ch/g)].map((match) => match[1] ?? "");
}

describe("withLineIndents", () => {
  it("tags every line with its indentation", () => {
    const code = "notes.update(id, (draft) => {\n  draft.title = title;\n\n    deeper();\n});";
    expect(indentsOf(withLineIndents(highlight(code), code))).toEqual(["0", "2", "0", "4", "0"]);
  });

  it("counts tabs as two spaces", () => {
    const code = "a\n\tb";
    expect(indentsOf(withLineIndents(highlight(code), code))).toEqual(["0", "2"]);
  });

  it("leaves the highlighted tokens alone", () => {
    const code = 'const x = "y";';
    const html = highlight(code);
    expect(withLineIndents(html, code).replace(' style="--indent:0ch"', "")).toBe(html);
  });
});
