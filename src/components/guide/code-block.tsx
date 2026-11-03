import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { highlight } from "sugar-high";

import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  /** Shown in the header, e.g. `src/collections/notes.ts`. */
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, filename, className }: CodeBlockProps) {
  const html = useMemo(() => highlight(code.trim()), [code]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <figure
      className={cn(
        "group/code my-5 overflow-hidden rounded-xl border bg-muted/40 dark:bg-white/[0.03]",
        className,
      )}
    >
      <figcaption className="flex h-9 items-center justify-between border-b px-4 font-mono text-xs text-muted-foreground">
        <span>{filename ?? "example.ts"}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-muted focus-visible:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </figcaption>
      <pre className="notes-scroll overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed">
        {/* sugar-high only emits <span>s with colour variables, from our own static snippets. */}
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}
