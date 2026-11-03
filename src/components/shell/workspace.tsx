import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BrowserFrame } from "@/components/browser/browser-frame";
import { GuidePanel } from "@/components/guide/guide-panel";
import { usePageTitle } from "@/components/notes/use-page-title";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * The page: the guide and the app as two framed panels with a resizable gap
 * between them. Side by side on desktop; stacked (app on top) on small screens.
 */
export function Workspace({ app }: { app: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const title = usePageTitle();
  const path = useLocation({ select: (location) => location.pathname });

  const appPanel = (
    <Frame>
      <BrowserFrame title={title} path={path} compact={!isDesktop}>
        {app}
      </BrowserFrame>
    </Frame>
  );
  const guidePanel = (
    <Frame>
      <GuidePanel />
    </Frame>
  );

  return (
    <main className="h-dvh bg-muted p-2 lg:p-4 dark:bg-[#0c0c0d]">
      {isDesktop ? (
        <ResizablePanelGroup key="desktop" orientation="horizontal">
          <ResizablePanel id="guide" defaultSize="34%" minSize={320}>
            {guidePanel}
          </ResizablePanel>
          <GapHandle orientation="horizontal" />
          <ResizablePanel id="app" defaultSize="66%" minSize={720}>
            {appPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <ResizablePanelGroup key="mobile" orientation="vertical">
          <ResizablePanel id="app" defaultSize="50%" minSize={220}>
            {appPanel}
          </ResizablePanel>
          <GapHandle orientation="vertical" />
          <ResizablePanel id="guide" defaultSize="50%" minSize={120}>
            {/* Phase 4 can turn this panel into Guide / Requests tabs. */}
            {guidePanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
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
function GapHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const horizontal = orientation === "horizontal";
  return (
    <ResizableHandle
      className={cn(
        "group/handle bg-transparent after:hidden focus-visible:ring-0",
        horizontal ? "w-3 lg:w-4" : "aria-[orientation=horizontal]:h-2",
      )}
    >
      <span
        className={cn(
          "rounded-full bg-foreground/15 transition-colors group-hover/handle:bg-foreground/40 group-data-[separator=hover]/handle:bg-foreground/40 group-data-[separator=active]/handle:bg-guide-accent group-focus-visible/handle:bg-guide-accent",
          horizontal ? "h-10 w-1" : "h-1 w-10",
        )}
      />
    </ResizableHandle>
  );
}
