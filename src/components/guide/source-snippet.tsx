import type { Snippet } from "@/guide/snippets";

import { CodeBlock } from "./code-block";

/** A snippet quoted from the app's source, labelled with the file it's from. */
export function SourceSnippet({ snippet }: { snippet: Snippet }) {
  return <CodeBlock code={snippet.code} filename={snippet.file} />;
}
