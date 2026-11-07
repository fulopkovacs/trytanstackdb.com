/**
 * Tags each line sugar-high renders (`<span class="sh__line">`) with its
 * indentation, as `--indent: <n>ch`. With that, CSS can soft-wrap long lines
 * on small screens and hang the continuation under the line's own start
 * (see `.code-wrap` in styles.css). Tabs count as two spaces.
 */
export function withLineIndents(html: string, code: string): string {
  const indents = code
    .split("\n")
    .map((line) => (/^[ \t]*/.exec(line)?.[0] ?? "").replaceAll("\t", "  ").length);
  let index = 0;
  return html.replaceAll(
    '<span class="sh__line">',
    () => `<span class="sh__line" style="--indent:${indents[index++] ?? 0}ch">`,
  );
}
