import { useEffect } from "react";
import type { RefObject } from "react";

const TABBABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Menus, dialogs and toasts are portalled to <body>, outside the trap. They
 * manage their own focus, so the trap leaves them alone.
 */
const LAYER =
  "[data-radix-popper-content-wrapper], [role=dialog], [role=alertdialog], [data-sonner-toaster]";

function isInLayer(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest(LAYER) != null;
}

/** Elements Tab can reach inside `container`, in DOM order (inert and hidden ones skipped). */
function tabbables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) =>
      !element.closest("[inert]") &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden",
  );
}

/**
 * Keeps keyboard focus inside `containerRef` while `active`, for modal
 * surfaces whose content must stay mounted (so no unmount-based focus scope):
 *
 * - focuses the container when activated, and gives focus back to whatever
 *   had it when deactivated,
 * - wraps Tab / Shift+Tab at both ends, and pulls focus back in if it got out,
 * - recovers focus when the focused element disappears (e.g. the app inside
 *   changes screens), instead of letting it fall to <body>.
 *
 * Menus and dialogs opened from inside get to keep focus while they're open.
 *
 * Listens on the document rather than the container, because content can be
 * portalled in from elsewhere in the React tree (React key events wouldn't
 * bubble through the container's handlers).
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    const returnFocusTo = document.activeElement;
    container.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const items = tabbables(container);
      const first = items[0];
      const last = items.at(-1);
      const focused = document.activeElement;
      if (focused && !container.contains(focused) && isInLayer(focused)) return;
      if (!first || !last) {
        event.preventDefault();
        container.focus({ preventScroll: true });
      } else if (!(focused instanceof Node) || !container.contains(focused)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (focused === first || focused === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && focused === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Something outside got focus (a click on a devtools overlay, a script): take it back.
    const onFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !container.contains(event.target) &&
        !isInLayer(event.target)
      ) {
        container.focus({ preventScroll: true });
      }
    };

    // Removing the focused element moves focus to <body> without any event.
    const observer = new MutationObserver(() => {
      if (document.activeElement === document.body || document.activeElement === null) {
        container.focus({ preventScroll: true });
      }
    });

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      observer.disconnect();
      if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [containerRef, active]);
}
