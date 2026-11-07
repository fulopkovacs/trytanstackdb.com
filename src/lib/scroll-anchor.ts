/**
 * Scroll positions anchored to elements instead of raw pixels.
 *
 * When the app sheet closes, the guide must be exactly where the reader left
 * it, even if something above that point changed height in the meantime (a
 * section gained its "You did it" check, a font finished loading…). So instead
 * of `scrollTop` alone we remember which section was at the top of the view
 * and how far it was from the top edge, and put it back there.
 */

/** An anchor element's position relative to the top edge of the scroll viewport. */
export interface AnchorBox {
  id: string;
  top: number;
  bottom: number;
}

export interface ScrollAnchor {
  scrollTop: number;
  /** The anchor at the top edge of the view, if any. */
  anchorId: string | null;
  /** Where that anchor's top was, relative to the top edge (≤ 0 once scrolled into it). */
  anchorTop: number;
}

/**
 * The anchor that contains the line `offset` px below the top of the view. In
 * a gap between anchors, the last one above the line wins; above the first
 * anchor there is none.
 */
export function anchorAt(boxes: readonly AnchorBox[], offset: number): AnchorBox | undefined {
  let match: AnchorBox | undefined;
  for (const box of boxes) {
    if (box.top > offset) break;
    match = box;
  }
  return match;
}

/** The `scrollTop` that puts the anchor back where it was, clamped to the scroll range. */
export function scrollTopForAnchor({
  saved,
  currentScrollTop,
  currentAnchorTop,
  maxScrollTop,
}: {
  saved: ScrollAnchor;
  currentScrollTop: number;
  /** Where the anchor is now, or `undefined` if it's gone. */
  currentAnchorTop: number | undefined;
  maxScrollTop: number;
}): number {
  const target =
    currentAnchorTop === undefined
      ? saved.scrollTop
      : currentScrollTop + (currentAnchorTop - saved.anchorTop);
  return Math.min(Math.max(target, 0), Math.max(maxScrollTop, 0));
}

/* DOM side ----------------------------------------------------------------- */

const ANCHOR_SELECTOR = "[data-scroll-anchor]";

/** Measures every `[data-scroll-anchor]` element inside `container`, in document order. */
export function measureAnchors(container: HTMLElement): AnchorBox[] {
  const viewportTop = container.getBoundingClientRect().top;
  return Array.from(container.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR), (element) => {
    const rect = element.getBoundingClientRect();
    return { id: element.id, top: rect.top - viewportTop, bottom: rect.bottom - viewportTop };
  });
}

export function captureScrollAnchor(container: HTMLElement): ScrollAnchor {
  const anchor = anchorAt(measureAnchors(container), 0);
  return {
    scrollTop: container.scrollTop,
    anchorId: anchor?.id ?? null,
    anchorTop: anchor?.top ?? 0,
  };
}

export function restoreScrollAnchor(container: HTMLElement, saved: ScrollAnchor) {
  const current = saved.anchorId
    ? measureAnchors(container).find((box) => box.id === saved.anchorId)
    : undefined;
  container.scrollTop = scrollTopForAnchor({
    saved,
    currentScrollTop: container.scrollTop,
    currentAnchorTop: current?.top,
    maxScrollTop: container.scrollHeight - container.clientHeight,
  });
}
