import { Check } from "lucide-react";
import type { RefObject } from "react";

import { ThemeMenu } from "@/components/theme/theme-menu";
import { GUIDE_SECTIONS } from "@/guide/content";
import { useAnchorInView } from "@/hooks/use-anchor-in-view";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { DevGuideMenu } from "./dev-guide-menu";
import { useActiveSection, useIsSectionDone } from "./guide-store";
import { TanStackDbMark } from "./tanstack-db-mark";

/**
 * Compact header for the full-screen guide: the logo, a chip naming the
 * current section, and one theme button. The chip shows the active section
 * (the one matching what you did in the app), otherwise the one you're
 * reading; tapping it scrolls there.
 */
export function MobileGuideHeader({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const activeSectionId = useActiveSection();
  const sectionInView = useAnchorInView(scrollRef);
  const chipSectionId = activeSectionId ?? sectionInView;

  return (
    <header className="box-content flex h-14 shrink-0 items-center gap-2.5 border-b bg-background px-4 pt-[env(safe-area-inset-top)]">
      <TanStackDbMark />
      {chipSectionId ? (
        <SectionChip sectionId={chipSectionId} active={chipSectionId === activeSectionId} />
      ) : (
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          Try TanStack DB
        </span>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {import.meta.env.DEV && <DevGuideMenu />}
        <ThemeMenu />
      </div>
    </header>
  );
}

function SectionChip({ sectionId, active }: { sectionId: string; active: boolean }) {
  const section = GUIDE_SECTIONS.find((section) => section.id === sectionId);
  const done = useIsSectionDone(sectionId);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (!section) return null;

  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
      }
      aria-label={`Current section: ${section.title}. Scroll to it.`}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
        active
          ? "border-guide-accent/40 bg-guide-accent-soft text-foreground"
          : "bg-muted/50 text-foreground",
      )}
    >
      {done ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
      ) : active ? (
        <span className="size-1.5 animate-pulse rounded-full bg-guide-accent" />
      ) : null}
      {section.shortTitle}
    </button>
  );
}
