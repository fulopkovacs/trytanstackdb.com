import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useShowInAppSheet } from "@/components/app-sheet/app-sheet-store";
import { useIsAppInSheet } from "@/components/guide/try-it";
import { setInspectorOpen } from "@/components/network/inspector-store";
import { queryOnce } from "@tanstack/react-db";

import { newestNoteQuery } from "@/db/queries";
import { createStore, useStore } from "@/lib/store";

import {
  SPOTLIGHT_TARGETS,
  findSpotlightElement,
  folderIdFromPath,
  isNetworkTarget,
  routeForTarget,
} from "./spotlight-targets";
import type { SpotlightTarget } from "./spotlight-targets";

/** How long a spotlight stays up if the reader doesn't dismiss it. */
const SPOTLIGHT_DURATION_MS = 8000;
/** How long to wait for the target to show up (a route change, the sheet opening). */
const FIND_TIMEOUT_MS = 2000;

const spotlightStore = createStore<{ target: SpotlightTarget; id: number } | null>(null);
let nextId = 1;

export function dismissSpotlight() {
  spotlightStore.set(null);
}

/** A note to open for the editor: the newest in the folder you're in, or anywhere. */
async function noteToOpen(pathname: string) {
  for (const folderId of new Set([folderIdFromPath(pathname), "all"])) {
    const [note] = await queryOnce(newestNoteQuery(folderId));
    if (note) return { folderId, noteId: note.id };
  }
  return undefined;
}

/**
 * Points the reader at a part of the app: brings it on screen (opens the
 * sheet on phones, the request inspector, the right route) and spotlights it.
 */
export function useShowSpotlight() {
  const router = useRouter();
  const inSheet = useIsAppInSheet();
  const showInAppSheet = useShowInAppSheet();

  return useCallback(
    async (target: SpotlightTarget) => {
      const { pathname } = router.state.location;
      const onScreen = document.querySelector(`[data-spotlight="${target}"]`) !== null;
      const route = onScreen
        ? null
        : routeForTarget(
            target,
            pathname,
            target === "editor" ? await noteToOpen(pathname) : undefined,
          );
      if (inSheet) {
        showInAppSheet(route, isNetworkTarget(target) ? "network" : "app");
      } else {
        if (target === "request-inspector") setInspectorOpen(true);
        if (route) void router.navigate(route);
      }
      spotlightStore.set({ target, id: nextId++ });
    },
    [router, inSheet, showInAppSheet],
  );
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;

/**
 * The spotlight: a ring around the target with the rest of the page dimmed.
 * It never takes focus or blocks the page (it ignores the pointer); Escape,
 * any click or tap, or a few seconds dismiss it. It follows the target while
 * it moves (the sheet sliding up, the page scrolling).
 */
export function SpotlightOverlay() {
  const spotlight = useStore(spotlightStore);
  const [box, setBox] = useState<Box | null>(null);
  const scrolledFor = useRef<number | null>(null);

  // Track the target's position every frame while the spotlight is up.
  useEffect(() => {
    setBox(null);
    if (!spotlight) return;
    const startedAt = performance.now();
    let frame = 0;
    const track = () => {
      const element = findSpotlightElement(spotlight.target);
      if (!element) {
        setBox(null);
        if (performance.now() - startedAt > FIND_TIMEOUT_MS) return dismissSpotlight();
      } else {
        if (scrolledFor.current !== spotlight.id) {
          scrolledFor.current = spotlight.id;
          element.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        const rect = element.getBoundingClientRect();
        // Clip to the viewport, so a long list's ring stays on screen.
        const top = Math.max(rect.top, 0) - PADDING;
        const bottom = Math.min(rect.bottom, window.innerHeight) + PADDING;
        const left = Math.max(rect.left, 0) - PADDING;
        const right = Math.min(rect.right, window.innerWidth) + PADDING;
        setBox((previous) =>
          previous &&
          previous.top === top &&
          previous.left === left &&
          previous.width === right - left &&
          previous.height === bottom - top
            ? previous
            : { top, left, width: right - left, height: bottom - top },
        );
      }
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    const timeout = window.setTimeout(dismissSpotlight, SPOTLIGHT_DURATION_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [spotlight]);

  // Escape or any press dismisses it. Escape is taken here, so it doesn't
  // also close the app sheet behind the spotlight.
  useEffect(() => {
    if (!spotlight) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismissSpotlight();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("pointerdown", dismissSpotlight, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("pointerdown", dismissSpotlight, { capture: true });
    };
  }, [spotlight]);

  const label = spotlight ? SPOTLIGHT_TARGETS[spotlight.target].label : null;

  return (
    <>
      <p role="status" className="sr-only">
        {spotlight && box
          ? `Showing the ${label?.toLowerCase()} in the app. Press Escape to dismiss.`
          : ""}
      </p>
      {spotlight && box && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
          <div
            key={spotlight.id}
            className="spotlight-ring absolute rounded-xl"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className="spotlight-label absolute rounded-full bg-guide-accent px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-white shadow-md"
            style={
              box.top > 40
                ? { top: box.top - 30, left: Math.max(8, box.left) }
                : { top: box.top + box.height + 6, left: Math.max(8, box.left) }
            }
          >
            {label}
          </span>
        </div>
      )}
    </>
  );
}
