import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { closeAppSheet } from "@/components/app-sheet/app-sheet-store";
import { BrowserFrame } from "@/components/browser/browser-frame";
import { GuidePanel } from "@/components/guide/guide-panel";
import { usePageTitle } from "@/components/notes/use-page-title";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";

import { MobileWorkspace } from "./mobile-workspace";

/** At this width and up, the guide and the app sit side by side. Below it, the guide comes first. */
export const SPLIT_LAYOUT_MIN_WIDTH = 768;

/**
 * The page. Wide screens: the guide and the app (in a fake browser) as two
 * framed panels with a resizable gap between them. Small screens: the guide
 * full screen, with the app in a sheet that "Try it" buttons open.
 */
export function Workspace({ app }: { app: ReactNode }) {
  const isSplit = useMediaQuery(`(min-width: ${SPLIT_LAYOUT_MIN_WIDTH}px)`);
  return isSplit ? <SplitWorkspace app={app} /> : <MobileWorkspace app={app} />;
}

function SplitWorkspace({ app }: { app: ReactNode }) {
  // Tablets and small laptop windows get a narrower guide and smaller minimums;
  // the app switches to its iPhone layout when its pane gets narrow.
  const isWide = useMediaQuery("(min-width: 1024px)");
  const title = usePageTitle();
  const path = useLocation({ select: (location) => location.pathname });

  // The app sheet only exists on small screens. If the window grows past the
  // breakpoint while it's open (a tablet rotating), don't bring it back later.
  useEffect(() => closeAppSheet(), []);

  return (
    <main className="h-dvh bg-muted p-2 lg:p-4 dark:bg-[#0c0c0d]">
      <ResizablePanelGroup key={isWide ? "wide" : "narrow"} orientation="horizontal">
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
              {app}
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
