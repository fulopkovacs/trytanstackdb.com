/**
 * Swipe-to-close maths for the bottom sheet, kept free of the DOM so it can be
 * tested on its own.
 */

/** Movement (px) before a press on the header counts as a drag rather than a tap. */
export const DRAG_START_THRESHOLD = 6;

/** Dragged further than this share of the sheet's height: close on release. */
const CLOSE_DISTANCE_RATIO = 0.25;
/** A downward flick faster than this (px/ms) closes, however short. */
const CLOSE_VELOCITY = 0.5;
/** …as long as it moved at least this far, so a jittery tap doesn't close. */
const MIN_FLICK_DISTANCE = 24;

/**
 * How far the sheet follows the finger. Down: one to one. Up: the sheet is
 * already fully open, so it gives a little and resists, like iOS sheets do.
 */
export function sheetOffset(dragDistance: number): number {
  if (dragDistance >= 0) return dragDistance;
  return -12 * (1 - Math.exp(dragDistance / 60));
}

export function shouldCloseOnRelease({
  offset,
  velocity,
  sheetHeight,
}: {
  /** Current downward offset in px. */
  offset: number;
  /** Downward speed at release in px/ms (negative when moving up). */
  velocity: number;
  sheetHeight: number;
}): boolean {
  if (offset >= sheetHeight * CLOSE_DISTANCE_RATIO) return true;
  return velocity >= CLOSE_VELOCITY && offset >= MIN_FLICK_DISTANCE;
}
