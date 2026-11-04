/**
 * Guide snippets are quoted from the app's real source, so they can't drift
 * from the code. A quotable part of a file is wrapped in region comments:
 *
 *   // #region notes-collection
 *   export const notesCollection = …
 *   // #endregion notes-collection
 *
 * `extractRegion` returns the lines in between, without their common
 * indentation and without the markers of any regions nested inside.
 */

const REGION_START = /^\s*\/\/ #region (\S+)\s*$/;
const REGION_END = /^\s*\/\/ #endregion(?: (\S+))?\s*$/;

/** Every region in a file, by name, with the line range of its contents. */
export function listRegions(source: string): Map<string, { start: number; end: number }> {
  const lines = source.split("\n");
  const regions = new Map<string, { start: number; end: number }>();
  const open: { name: string; start: number }[] = [];
  lines.forEach((line, index) => {
    const start = REGION_START.exec(line);
    if (start) {
      const name = start[1]!;
      if (regions.has(name) || open.some((region) => region.name === name)) {
        throw new Error(`Region "${name}" is defined twice.`);
      }
      open.push({ name, start: index + 1 });
      return;
    }
    const end = REGION_END.exec(line);
    if (!end) return;
    const region = open.pop();
    if (!region) throw new Error(`#endregion on line ${index + 1} has no #region.`);
    if (end[1] !== undefined && end[1] !== region.name) {
      throw new Error(`#endregion ${end[1]} on line ${index + 1} closes region "${region.name}".`);
    }
    regions.set(region.name, { start: region.start, end: index });
  });
  if (open.length > 0) throw new Error(`Region "${open.at(-1)!.name}" is never closed.`);
  return regions;
}

export function extractRegion(source: string, name: string): string {
  const region = listRegions(source).get(name);
  if (!region) throw new Error(`No region named "${name}".`);
  const lines = source
    .split("\n")
    .slice(region.start, region.end)
    .filter((line) => !REGION_START.test(line) && !REGION_END.test(line));
  const indent = Math.min(
    ...lines.filter((line) => line.trim() !== "").map((line) => /^ */.exec(line)![0].length),
  );
  return lines
    .map((line) => line.slice(indent))
    .join("\n")
    .trim();
}

/** The `index`th fenced code block in `language` in a Markdown file. */
export function extractCodeFence(markdown: string, language: string, index: number): string {
  const fences = [...markdown.matchAll(/^```(\S*)\n([\s\S]*?)^```$/gm)]
    .filter((match) => match[1] === language)
    .map((match) => match[2]!.trim());
  const fence = fences[index];
  if (fence === undefined) throw new Error(`No ${language} code block #${index}.`);
  return fence;
}
