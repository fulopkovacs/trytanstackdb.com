import { useLocation } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { AppSheet } from "@/components/app-sheet/app-sheet";
import {
  rememberSheetLocation,
  useIsAppSheetOpen,
  useOpenAppSheet,
} from "@/components/app-sheet/app-sheet-store";
import { GuideDocument } from "@/components/guide/guide-document";
import { MobileGuideHeader } from "@/components/guide/mobile-guide-header";
import { TryItProvider } from "@/components/guide/try-it";
import { useFollowActiveSection } from "@/components/guide/use-follow-active-section";
import { useReadingPosition } from "@/components/guide/use-reading-position";
import { captureScrollAnchor, restoreScrollAnchor } from "@/lib/scroll-anchor";
import { setRecordSheetState } from "@/lib/sheet-aware-history";
import type { ScrollAnchor } from "@/lib/scroll-anchor";

/**
 * Small screens: the guide fills the screen, and each hands-on section's
 * "Try it" slides the app up as a sheet, already on the screen the section is
 * about. Whether the sheet is open follows browser history (Back closes it);
 * closing it puts the guide back exactly where it was.
 */
export function MobileWorkspace({ appSlot }: { appSlot: ReactNode }) {
  const open = useIsAppSheetOpen();
  const openAppSheet = useOpenAppSheet();
  const href = useLocation({ select: (location) => location.href });
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef<ScrollAnchor | null>(null);

  // While this layout shows, history entries record whether the sheet is open.
  useLayoutEffect(() => {
    setRecordSheetState(true);
    return () => setRecordSheetState(false);
  }, []);

  // Same place in the guide as before a layout change…
  useReadingPosition(scrollRef);

  // …and as before the sheet opened, once it closes.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (open) {
      savedScroll.current = captureScrollAnchor(container);
    } else if (savedScroll.current) {
      restoreScrollAnchor(container, savedScroll.current);
      savedScroll.current = null;
    }
  }, [open]);

  // The highlighted section can change while the sheet covers the guide: it
  // lights up now, and the guide scrolls to it once the sheet closes.
  useFollowActiveSection(scrollRef, open);

  // Where the app was, so the next "Try it" for this screen picks up there.
  useEffect(() => {
    if (open) rememberSheetLocation(href);
  }, [open, href]);

  return (
    <TryItProvider onTryIt={openAppSheet}>
      <div className="flex h-dvh flex-col bg-background" inert={open}>
        <MobileGuideHeader scrollRef={scrollRef} />
        <div
          ref={scrollRef}
          data-wrap-code
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
        >
          <GuideDocument />
        </div>
      </div>
      <AppSheet app={appSlot} />
    </TryItProvider>
  );
}
