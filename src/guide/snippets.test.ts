import { describe, expect, it } from "vite-plus/test";

import { extractCodeFence, extractRegion, listRegions } from "./source-regions";
import { NEON_README_SNIPPETS, QUOTED_SOURCES, SNIPPETS } from "./snippets";

const allSources = import.meta.glob<string>(["/src/**/*.{ts,tsx}", "!/src/**/*.test.*"], {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("extractRegion", () => {
  const source = [
    "const before = 1;",
    "function outer() {",
    "  // #region body",
    "  const a = 1;",
    "  // #region inner",
    "  if (a) {",
    "    return a;",
    "  }",
    "  // #endregion inner",
    "  // #endregion body",
    "}",
  ].join("\n");

  it("returns the lines in between, dedented, without nested markers", () => {
    expect(extractRegion(source, "body")).toBe(
      ["const a = 1;", "if (a) {", "  return a;", "}"].join("\n"),
    );
    expect(extractRegion(source, "inner")).toBe(["if (a) {", "  return a;", "}"].join("\n"));
  });

  it("throws for a missing or broken region", () => {
    expect(() => extractRegion(source, "nope")).toThrow(/No region/);
    expect(() => listRegions("// #region open\nconst a = 1;")).toThrow(/never closed/);
    expect(() => listRegions("// #region a\n// #endregion b")).toThrow(/closes region "a"/);
    expect(() => listRegions("// #endregion")).toThrow(/has no #region/);
  });
});

describe("guide snippets", () => {
  it("are quoted from the real files, line for line", () => {
    for (const [name, snippet] of Object.entries(SNIPPETS)) {
      expect(snippet.code, name).not.toBe("");
      expect(snippet.code, name).not.toMatch(/#(end)?region/);
      const sourceLines = new Set(QUOTED_SOURCES[snippet.file].split("\n").map((l) => l.trim()));
      for (const line of snippet.code.split("\n")) {
        if (line.trim() === "") continue;
        expect(sourceLines.has(line.trim()), `${name}: ${line}`).toBe(true);
      }
    }
  });

  it("read the files the guide names", () => {
    for (const [path, source] of Object.entries(QUOTED_SOURCES)) {
      expect(allSources[`/${path}`], path).toBe(source);
    }
  });

  it("cover every region marker in the code, so none go stale", () => {
    const quoted = new Set(Object.values(SNIPPETS).map(({ file, region }) => `${file}#${region}`));
    for (const [path, source] of Object.entries(allSources)) {
      for (const region of listRegions(source).keys()) {
        expect(quoted.has(`${path.slice(1)}#${region}`), `${path} #region ${region}`).toBe(true);
      }
    }
  });
});

describe("Neon README snippets", () => {
  it("are the README's usage and mutation examples", () => {
    expect(NEON_README_SNIPPETS.collection.code).toContain("realtimeCollectionOptions({");
    expect(NEON_README_SNIPPETS.awaitTxId.code).toContain(
      "await collection.utils.awaitTxId(txid);",
    );
  });

  it("extractCodeFence picks blocks by language", () => {
    const markdown = "```bash\nnpm i\n```\n\ntext\n\n```ts\nconst a = 1;\n```\n";
    expect(extractCodeFence(markdown, "ts", 0)).toBe("const a = 1;");
    expect(() => extractCodeFence(markdown, "ts", 1)).toThrow();
  });
});
