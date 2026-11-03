import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { anchorAt, measureAnchors } from "@/lib/scroll-anchor";

/**
 * Id of the `[data-scroll-anchor]` element the reader is looking at in a
 * scroll container: the one crossing a line `lineRatio` of the way down the
 * view (or the last one, once scrolled to the end). `null` above the first.
 */
export function useAnchorInView(
  containerRef: RefObject<HTMLElement | null>,
  lineRatio = 0.3,
): string | null {
  const [anchorId, setAnchorId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const atEnd =
        container.scrollTop > 0 &&
        container.scrollTop >= container.scrollHeight - container.clientHeight - 1;
      const line = atEnd ? container.clientHeight : container.clientHeight * lineRatio;
      setAnchorId(anchorAt(measureAnchors(container), line)?.id ?? null);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    container.addEventListener("scroll", scheduleUpdate, { passive: true });
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
    };
  }, [containerRef, lineRatio]);

  return anchorId;
}
