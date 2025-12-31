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
 * @param externalRef - Optional external ref to use instead of creating a new one
 * @param deps - Optional dependency array that triggers shadow recalculation when changed
 * @returns Object containing the scroll ref and boolean flags for shadow visibility
 */
export function useScrollShadow(
  externalRef?: React.RefObject<HTMLDivElement | null>,
  deps: React.DependencyList = [],
): UseScrollShadowReturn {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef ?? internalRef;
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  /**
    The biome-ignores are necessary because:
    - Adding scrollRef.current to the dependency array won't work as expected (React doesn't track ref mutations)
    - We've already solved the "stale ref" problem by adding the deps parameter that consumers can use to trigger recalculation
  */
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef.current is intentionally not a dependency - refs don't trigger re-renders
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef.current is intentionally not a dependency - refs don't trigger re-renders
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScrollShadows, ...deps]);

  return { scrollRef, canScrollUp, canScrollDown };
}
