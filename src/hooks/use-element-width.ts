import { useLayoutEffect, useRef, useState } from "react";

/**
 * Tracks an element's width with a ResizeObserver. Used for layout decisions
 * that depend on the app pane (which the user can resize), not the window.
 * Returns `null` until the first measurement.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
