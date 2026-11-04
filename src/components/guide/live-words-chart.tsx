import { useEffect, useRef, useState } from "react";

import { folderChartHeight, useAnalyticsRows } from "@/components/notes/analytics-data";
import { ChartPlaceholder, LazyFolderBarChart } from "@/components/notes/lazy-charts";

/**
 * Words per folder, drawn in the guide from the same live query as the
 * Analytics page. With the app beside the guide, it moves as you type.
 *
 * The guide is on screen from the first paint, but this chart sits far down
 * it: the chart library only loads once the chart comes near the viewport.
 */
export function LiveWordsChart() {
  const { folderRows } = useAnalyticsRows();
  const ref = useRef<HTMLElement>(null);
  const nearViewport = useNearViewport(ref);

  return (
    <figure
      ref={ref}
      className="analytics-chart not-prose my-5 rounded-xl border bg-background/60 px-4 pt-3 pb-2 text-[13px]"
    >
      <figcaption className="mb-1 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
        <span
          className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
          aria-hidden
        />
        Live: words per folder
      </figcaption>
      {nearViewport ? (
        <LazyFolderBarChart rows={folderRows} measure="words" />
      ) : (
        <ChartPlaceholder height={folderChartHeight(folderRows.length)} />
      )}
    </figure>
  );
}

/** Becomes `true` (and stays) once the element is within a screen of the viewport. */
function useNearViewport(ref: React.RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    // The guide scrolls inside its own container; the margin only reaches
    // past the edge of the observer's root, so observe from there.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { root: scrollParent(element), rootMargin: "100% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}
