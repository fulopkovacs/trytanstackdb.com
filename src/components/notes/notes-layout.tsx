import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { useElementWidth } from "@/hooks/use-element-width";

/**
 * The Notes clone has two looks: the three-column macOS app, and the iPhone
 * app (one screen at a time). Which one we show depends on the width of the
 * app pane, so dragging the divider or opening the page on a phone both work.
 */
export const IOS_LAYOUT_MAX_WIDTH = 640;

export type NotesLayout = "mac" | "ios";

interface NotesLayoutContextValue {
  layout: NotesLayout;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
}

const NotesLayoutContext = createContext<NotesLayoutContextValue | null>(null);
const FixedLayoutContext = createContext<NotesLayout | null>(null);

/**
 * Pins the layout regardless of width (`null`: pick by width). The app sheet
 * on small screens always shows the iPhone app, even on a phone in landscape.
 */
export function FixedNotesLayout({
  layout,
  children,
}: {
  layout: NotesLayout | null;
  children: ReactNode;
}) {
  return <FixedLayoutContext value={layout}>{children}</FixedLayoutContext>;
}

export function NotesLayoutProvider({ children }: { children: ReactNode }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const fixedLayout = useContext(FixedLayoutContext);

  const value = useMemo<NotesLayoutContextValue | null>(
    () =>
      width === null
        ? null
        : {
            layout: fixedLayout ?? (width < IOS_LAYOUT_MAX_WIDTH ? "ios" : "mac"),
            sidebarVisible,
            toggleSidebar: () => setSidebarVisible((visible) => !visible),
          },
    [width, fixedLayout, sidebarVisible],
  );

  return (
    <div ref={ref} className="@container/notes h-full w-full">
      {value && <NotesLayoutContext value={value}>{children}</NotesLayoutContext>}
    </div>
  );
}

export function useNotesLayout(): NotesLayoutContextValue {
  const context = useContext(NotesLayoutContext);
  if (!context) throw new Error("useNotesLayout must be used inside <NotesLayoutProvider>");
  return context;
}

/** Renders the macOS or the iPhone version of a screen. */
export function ByLayout({ mac, ios }: { mac: ReactNode; ios: ReactNode }) {
  return useNotesLayout().layout === "mac" ? mac : ios;
}
