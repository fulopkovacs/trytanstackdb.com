import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeMenu } from "@/components/theme/theme-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useMediaQuery } from "@/hooks/use-media-query";

import { TanStackDbMark } from "./tanstack-db-mark";

/**
 * A deep dive: a page of its own, outside the guide-and-app workspace. Same
 * prose and code styles as the guide; code wraps on small screens.
 */
export function DeepDivePage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  const wide = useMediaQuery("(min-width: 768px)");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 box-content flex h-14 items-center gap-2.5 border-b bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <TanStackDbMark />
        <Link
          to="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the guide
        </Link>
        <div className="ml-auto">{wide ? <ThemeToggle /> : <ThemeMenu />}</div>
      </header>
      <main data-wrap-code={wide ? undefined : ""}>
        <article className="mx-auto w-full max-w-[68ch] px-5 pt-8 pb-24 sm:px-7">
          <p className="text-xs font-semibold tracking-wide text-guide-accent uppercase">
            Deep dive
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance">{title}</h1>
          <div className="mt-3 text-[15px] leading-7 text-foreground/75">{intro}</div>
          <div className="guide-prose mt-6">{children}</div>
        </article>
      </main>
    </div>
  );
}
