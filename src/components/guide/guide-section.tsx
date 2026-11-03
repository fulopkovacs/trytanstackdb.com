import type { LinkOptions } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useActiveSection, useIsSectionDone } from "./guide-store";
import { TryItButton } from "./try-it";

interface GuideSectionProps {
  id: string;
  /** Small label above the heading, e.g. "Step 2". */
  eyebrow?: string;
  title: string;
  /** Where the section's hands-on step happens in the app, if it has one. */
  tryIt?: LinkOptions;
  children: ReactNode;
}

export function GuideSection({ id, eyebrow, title, tryIt, children }: GuideSectionProps) {
  const isActive = useActiveSection() === id;
  const isDone = useIsSectionDone(id);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isActive]);

  return (
    <section
      ref={ref}
      id={id}
      data-scroll-anchor
      data-active={isActive || undefined}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "relative scroll-mt-6 rounded-2xl border border-transparent px-5 py-6 transition-[background-color,border-color,box-shadow] duration-300 sm:px-7",
        "data-active:border-guide-accent/40 data-active:bg-guide-accent-soft data-active:shadow-[0_0_0_4px_color-mix(in_oklch,var(--guide-accent)_12%,transparent)]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-6 left-0 w-[3px] rounded-full bg-guide-accent opacity-0 transition-opacity duration-300 group-data-active:opacity-100 [[data-active]>&]:opacity-100"
      />
      <header className="mb-3 flex items-center gap-2">
        {eyebrow && (
          <span className="text-xs font-semibold tracking-wide text-guide-accent uppercase">
            {eyebrow}
          </span>
        )}
        {isDone && (
          <span
            className="grid size-4 place-items-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500"
            title="Done"
          >
            <Check className="size-3" strokeWidth={3} aria-hidden />
            <span className="sr-only">Done</span>
          </span>
        )}
        {isActive && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-guide-accent px-2 py-0.5 text-[11px] font-semibold text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" />
            You are here
          </span>
        )}
      </header>
      <h2 className="mb-3 text-[1.35rem] leading-tight font-semibold tracking-tight text-balance">
        {title}
      </h2>
      <div className="guide-prose">{children}</div>
      {tryIt && <TryItButton sectionId={id} target={tryIt} />}
    </section>
  );
}
