import { useCallback, useEffect, useRef, useState } from "react";

export interface UseScrollShadowReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  canScrollUp: boolean;
  canScrollDown: boolean;
}

/**
 * Hook that tracks scroll position to determine if scroll shadows should be visible
 * at the top and bottom of a scrollable container.
 *
 * @returns Object containing the scroll ref and boolean flags for shadow visibility
 */
export function useScrollShadow(): UseScrollShadowReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollShadows = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;

    // Can scroll up if we're not at the top
    setCanScrollUp(scrollTop > 0);

    // Can scroll down if we're not at the bottom
    // Add a small threshold (1px) to account for sub-pixel rendering
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Initial check
    updateScrollShadows();

    // Update on scroll
    element.addEventListener("scroll", updateScrollShadows, { passive: true });

    // Update on resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateScrollShadows();
    });

    resizeObserver.observe(element);

    // Also observe changes to the content inside
    const mutationObserver = new MutationObserver(() => {
      updateScrollShadows();
    });

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      element.removeEventListener("scroll", updateScrollShadows);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollShadows]);

  return { scrollRef, canScrollUp, canScrollDown };
}
