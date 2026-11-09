import { useLayoutEffect } from "react";
import type { RefObject } from "react";

import { captureScrollAnchor, restoreScrollAnchor } from "@/lib/scroll-anchor";
import type { ScrollAnchor } from "@/lib/scroll-anchor";

/**
 * Where the reader is in the guide, kept across layouts. The split layout and
 * the small-screen layout each have their own guide scroll container; when
 * the window crosses the breakpoint the new one opens at the same section,
 * the same distance from the top.
 */
let readingPosition: ScrollAnchor | null = null;

export function useReadingPosition(scrollRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (readingPosition) restoreScrollAnchor(container, readingPosition);

    let frame = 0;
    const save = () => {
      frame = 0;
      readingPosition = captureScrollAnchor(container);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(save);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollRef]);
}
