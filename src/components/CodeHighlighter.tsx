import { useEffect, useState } from "react";
import { type BundledLanguage, codeToHtml } from "shiki";

type CodeHighlighterProps = {
  code: string;
  language?: BundledLanguage;
};

const className =
  "mt-1 rounded-md text-xs overflow-x-auto max-h-40 overflow-y-auto [&_.shiki]:p-3! [&_.shiki]:m-0! [&_.shiki]:bg-muted/50 [&_.shiki]:border [&_.shiki]:border-border/50 [&_.shiki]:rounded-md! [&_.shiki]:[--shiki-light-bg:transparent] [&_.shiki]:[--shiki-dark-bg:transparent] [&_.shiki_span]:[--shiki-light-bg:transparent] [&_.shiki_span]:[--shiki-dark-bg:transparent]";

export function CodeHighlighter({
  code,
  language = "json",
}: CodeHighlighterProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    codeToHtml(code, {
      lang: language,
      themes: {
        light: "material-theme-lighter",
        dark: "material-theme-darker",
      },
      defaultColor: false,
    }).then((result) => {
      if (!cancelled) {
        setHtml(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (html === null) {
    // Show plain text while loading
    return (
      <pre className={className}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
