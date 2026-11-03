import { useRouter } from "@tanstack/react-router";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { AppSheet } from "@/components/app-sheet/app-sheet";
import { openAppSheet, useAppSheet } from "@/components/app-sheet/app-sheet-store";
import { GuideDocument } from "@/components/guide/guide-document";
import { MobileGuideHeader } from "@/components/guide/mobile-guide-header";
import { TryItProvider } from "@/components/guide/try-it";
import type { TryItHandler } from "@/components/guide/try-it";
import { isOnScreen } from "@/lib/app-screen";
import { captureScrollAnchor, restoreScrollAnchor } from "@/lib/scroll-anchor";
import type { ScrollAnchor } from "@/lib/scroll-anchor";

/**
 * Small screens: the guide fills the screen, and each hands-on section's
 * "Try it" slides the app up as a sheet, already on the screen the section is
 * about. Closing it puts the guide back exactly where it was.
 */
export function MobileWorkspace({ app }: { app: ReactNode }) {
  const router = useRouter();
  const { open } = useAppSheet();
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef<ScrollAnchor | null>(null);

  const tryIt = useCallback<TryItHandler>(
    (sectionId, target) => {
      const screen = router.buildLocation(target).pathname;
      // Already on that screen (or deeper in it)? Leave the app where the reader left it.
      if (!isOnScreen(router.state.location.pathname, screen)) void router.navigate(target);
      openAppSheet({ sectionId });
    },
    [router],
  );

  // Remember the guide's position when the sheet opens; put it back when it closes.
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

  return (
    <TryItProvider onTryIt={tryIt}>
      <div className="flex h-dvh flex-col bg-background" inert={open}>
        <MobileGuideHeader scrollRef={scrollRef} />
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
        >
          <GuideDocument />
        </div>
      </div>
      <AppSheet app={app} />
    </TryItProvider>
  );
}
