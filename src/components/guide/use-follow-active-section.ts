import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import { useActiveSection } from "./guide-store";

/** After the reader scrolls the guide, leave it alone for this long. */
export const READER_SCROLL_COOLDOWN_MS = 2000;

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/**
 * Whether enough of a section is on screen that the reader can already see
 * it light up: at least 30% of the section, or of the view if the section is
 * taller than that.
 */
export function isSectionInView(
  section: { top: number; bottom: number },
  view: { top: number; bottom: number },
): boolean {
  const visible = Math.min(section.bottom, view.bottom) - Math.max(section.top, view.top);
  const needed = Math.min(section.bottom - section.top, view.bottom - view.top) * 0.3;
  return visible > 0 && visible >= needed;
}

/**
 * Scrolls the guide to the highlighted section, without fighting the reader:
 * not while they're scrolling (or just were), and not when the section is
 * already on screen.
 *
 * While `paused` (on phones: the app sheet is open over the guide) the
 * highlight changes but nothing scrolls; once it's unpaused, the guide
 * scrolls to the section if the highlight moved in the meantime.
 */
export function useFollowActiveSection(scrollRef: RefObject<HTMLElement | null>, paused = false) {
  const activeSectionId = useActiveSection();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const readerScrolledAt = useRef(Number.NEGATIVE_INFINITY);
  // The highlight we last acted on (scrolled to, or chose not to).
  const followedId = useRef<string | null>(null);
  const wasPaused = useRef(paused);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const markScrolling = () => {
      readerScrolledAt.current = performance.now();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) markScrolling();
    };
    // A press on the container itself (not its content) is a press on its scrollbar.
    const onPointerDown = (event: PointerEvent) => {
      if (event.target === container) markScrolling();
    };
    container.addEventListener("wheel", markScrolling, { passive: true });
    container.addEventListener("touchmove", markScrolling, { passive: true });
    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("pointerdown", onPointerDown);
    return () => {
      container.removeEventListener("wheel", markScrolling);
      container.removeEventListener("touchmove", markScrolling);
      container.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("pointerdown", onPointerDown);
    };
  }, [scrollRef]);

  useEffect(() => {
    const justUnpaused = wasPaused.current && !paused;
    wasPaused.current = paused;
    if (paused || !activeSectionId || activeSectionId === followedId.current) return;
    followedId.current = activeSectionId;

    const follow = () => {
      const container = scrollRef.current;
      const section = document.getElementById(activeSectionId);
      if (!container || !section || !container.contains(section)) return;
      if (performance.now() - readerScrolledAt.current < READER_SCROLL_COOLDOWN_MS) return;
      if (isSectionInView(section.getBoundingClientRect(), container.getBoundingClientRect())) {
        return;
      }
      section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };

    // Coming back from the sheet: let the guide settle where it was first, so
    // the reader sees it move to the section.
    if (!justUnpaused) return follow();
    const timer = window.setTimeout(follow, 350);
    return () => window.clearTimeout(timer);
  }, [activeSectionId, paused, reduceMotion, scrollRef]);
}
