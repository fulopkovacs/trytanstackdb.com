import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { BrowserFrame } from "@/components/browser/browser-frame";
import { GuidePanel } from "@/components/guide/guide-panel";
import { FixedNotesLayout } from "@/components/notes/notes-layout";
import { usePageTitle } from "@/components/notes/use-page-title";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SPLIT_LAYOUT_MIN_WIDTH } from "@/lib/layout";

import { AppSlot } from "./app-slot";
import { MobileWorkspace } from "./mobile-workspace";

/**
 * The page. Wide screens: the guide and the app (in a fake browser) as two
 * framed panels with a resizable gap between them. Small screens: the guide
 * full screen, with the app in a sheet that "Try it" buttons open.
 *
 * The app is rendered exactly once, here, and portalled into whichever
 * layout is showing (see `AppSlot`), so resizing across the breakpoint never
 * remounts it. Only its look changes: on small screens it's pinned to the
 * iPhone layout.
 */
export function Workspace({ app }: { app: ReactNode }) {
  const isSplit = useMediaQuery(`(min-width: ${SPLIT_LAYOUT_MIN_WIDTH}px)`);
  // This route renders on the client only (`ssr: false`), so `document` exists.
  const [appHost] = useState(() => {
    const host = document.createElement("div");
    host.className = "h-full";
    return host;
  });
  const appSlot = <AppSlot host={appHost} />;

  return (
    <>
      {isSplit ? <SplitWorkspace appSlot={appSlot} /> : <MobileWorkspace appSlot={appSlot} />}
      {createPortal(
        <FixedNotesLayout layout={isSplit ? null : "ios"}>{app}</FixedNotesLayout>,
        appHost,
      )}
    </>
  );
}

function SplitWorkspace({ appSlot }: { appSlot: ReactNode }) {
  // Tablets and small laptop windows get a narrower guide and smaller minimums
  // (the app switches to its iPhone layout when its pane gets narrow). Default
  // sizes only apply on mount; crossing this width later only changes the limits.
  const isWide = useMediaQuery("(min-width: 1024px)");
  const title = usePageTitle();
  const path = useLocation({ select: (location) => location.pathname });

  return (
    <main className="h-dvh bg-muted p-2 lg:p-4 dark:bg-[#0c0c0d]">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          id="guide"
          defaultSize={isWide ? "34%" : "42%"}
          minSize={isWide ? 320 : 280}
        >
          <Frame>
            <GuidePanel />
          </Frame>
        </ResizablePanel>
        <GapHandle />
        <ResizablePanel id="app" defaultSize={isWide ? "66%" : "58%"} minSize={isWide ? 720 : 360}>
          <Frame>
            <BrowserFrame title={title} path={path}>
              {appSlot}
            </BrowserFrame>
          </Frame>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-hidden rounded-xl border bg-background shadow-sm lg:rounded-2xl">
      {children}
    </div>
  );
}

/** The divider lives in the gap between the two panels. */
function GapHandle() {
  return (
    <ResizableHandle className="group/handle w-3 bg-transparent after:hidden focus-visible:ring-0 lg:w-4">
      <span className="h-10 w-1 rounded-full bg-foreground/15 transition-colors group-hover/handle:bg-foreground/40 group-data-[separator=hover]/handle:bg-foreground/40 group-data-[separator=active]/handle:bg-guide-accent group-focus-visible/handle:bg-guide-accent" />
    </ResizableHandle>
  );
}
