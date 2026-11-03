import { useEffect, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";

import { cn } from "@/lib/utils";

import { DRAG_START_THRESHOLD, sheetOffset, shouldCloseOnRelease } from "./sheet-gesture";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** The sheet's top bar. Together with the grab handle it's the area you can swipe down. */
  header: ReactNode;
  children: ReactNode;
}

/**
 * A near-full-screen sheet that slides up over the page, iOS style. Closes
 * with Escape, a tap on the dimmed page behind it, or a swipe down on its
 * header.
 *
 * Unlike a dialog, the content stays mounted while the sheet is closed (just
 * hidden and inert), so whatever is inside keeps its state between openings.
 * The open/close motion lives in `styles.css` (`.bottom-sheet`).
 */
export function BottomSheet({ open, onClose, label, header, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useSheetDrag({ sheetRef, backdropRef, onClose });

  // Move focus into the sheet when it opens, and back to where it was when it closes.
  useEffect(() => {
    if (!open) return;
    const returnFocusTo = document.activeElement;
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus({ preventScroll: true });
    };
  }, [open]);

  // Escape closes, wherever focus is (it drops to <body> when the app changes screens).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const state = open ? "open" : "closed";

  return (
    <>
      <div
        ref={backdropRef}
        data-state={state}
        aria-hidden
        onClick={onClose}
        className="bottom-sheet-backdrop fixed inset-0 z-40 touch-none bg-black/30 dark:bg-black/60"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={label}
        tabIndex={-1}
        inert={!open}
        data-state={state}
        className={cn(
          "bottom-sheet fixed inset-x-0 z-50 mx-auto flex max-w-2xl flex-col overflow-hidden outline-none",
          // Reaches 3rem below the screen (padded back up), so the slight overshoot
          // of the opening spring never shows a gap under the sheet.
          "top-[calc(env(safe-area-inset-top)+2rem)] -bottom-12 pb-12",
          "rounded-t-[22px] border-t border-black/5 bg-browser-toolbar shadow-[0_-8px_40px_rgb(0_0_0/0.18)] dark:border-white/10",
        )}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          {...drag.handlers}
        >
          <div className="flex justify-center pt-2 pb-1" aria-hidden>
            <span className="h-[5px] w-9 rounded-full bg-foreground/25" />
          </div>
          {header}
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
      </div>
    </>
  );
}

interface DragState {
  pointerId: number;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  /** Became a drag (moved past the threshold), as opposed to a tap. */
  dragging: boolean;
}

/**
 * Swipe down on the header to close. The sheet follows the pointer by writing
 * its transform directly (no re-render per frame); on release it either
 * closes or springs back, and the CSS transition animates from wherever the
 * finger left it.
 *
 * The press starts on the header, but the pointer leaves it almost at once,
 * so moves and the release are tracked on the window.
 */
function useSheetDrag({
  sheetRef,
  backdropRef,
  onClose,
}: {
  sheetRef: RefObject<HTMLDivElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const stopTrackingRef = useRef<(() => void) | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => () => stopTrackingRef.current?.(), []);

  function setOffset(offset: number | null) {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;
    if (offset === null) {
      sheet.style.removeProperty("transform");
      sheet.style.removeProperty("transition");
      backdrop.style.removeProperty("opacity");
      backdrop.style.removeProperty("transition");
      return;
    }
    sheet.style.transition = "none";
    sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
    backdrop.style.transition = "none";
    backdrop.style.opacity = String(Math.max(0, 1 - offset / sheet.offsetHeight));
  }

  function onPointerDown(event: ReactPointerEvent) {
    if (event.button !== 0 || stopTrackingRef.current) return;
    const drag: DragState = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      dragging: false,
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      const distance = event.clientY - drag.startY;
      if (!drag.dragging && Math.abs(distance) < DRAG_START_THRESHOLD) return;
      drag.dragging = true;
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) drag.velocity = (event.clientY - drag.lastY) / elapsed;
      drag.lastY = event.clientY;
      drag.lastTime = event.timeStamp;
      setOffset(sheetOffset(distance));
    };

    const onEnd = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      stopTracking();
      if (!drag.dragging) return;

      // The press was a drag, so it shouldn't also click a header button. That
      // click (if any) comes right after the release; don't swallow later ones.
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      });
      const sheetHeight = sheetRef.current?.offsetHeight ?? 0;
      const offset = sheetOffset(drag.lastY - drag.startY);
      // A pause before letting go cancels the flick.
      const velocity = event.timeStamp - drag.lastTime > 100 ? 0 : drag.velocity;
      const close =
        event.type === "pointerup" && shouldCloseOnRelease({ offset, velocity, sheetHeight });
      setOffset(null);
      if (close) onClose();
    };

    const stopTracking = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      stopTrackingRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    stopTrackingRef.current = stopTracking;
  }

  return {
    handlers: {
      onPointerDown,
      onClickCapture: (event: ReactMouseEvent) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}
