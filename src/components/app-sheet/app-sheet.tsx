import { Gauge } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

import {
  ComingSoonBadge,
  FailNextRequestControl,
  LatencyControl,
  RequestLog,
} from "@/components/network/network-controls";
import { cn } from "@/lib/utils";

import {
  setAppSheetView,
  useAppSheetView,
  useCloseAppSheet,
  useIsAppSheetOpen,
} from "./app-sheet-store";
import { BottomSheet } from "./bottom-sheet";

/**
 * The Notes app on small screens: a sheet over the guide, with the iPhone
 * layout inside. The header holds Close and a Network button that shows the
 * latency/failure controls and the request inspector over the app.
 *
 * `app` is the slot the (single, always mounted) Notes app is placed in; see
 * `AppSlot` in the workspace.
 */
export function AppSheet({ app }: { app: ReactNode }) {
  const open = useIsAppSheetOpen();
  const view = useAppSheetView();
  const closeAppSheet = useCloseAppSheet();
  const networkPanelId = useId();
  const showNetwork = view === "network";

  return (
    <BottomSheet
      open={open}
      onClose={closeAppSheet}
      label="Notes app"
      header={
        <div className="flex h-11 items-center justify-between px-3 pb-1">
          <button
            type="button"
            aria-expanded={showNetwork}
            aria-controls={networkPanelId}
            onClick={() => setAppSheetView(showNetwork ? "app" : "network")}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
              showNetwork
                ? "bg-foreground text-background"
                : "text-foreground/80 hover:bg-foreground/5",
            )}
          >
            <Gauge className="size-4" aria-hidden />
            Network
          </button>
          <button
            type="button"
            onClick={closeAppSheet}
            className="h-8 rounded-full border border-foreground/15 bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="h-full border-t" inert={showNetwork}>
        {app}
      </div>
      <NetworkPanel id={networkPanelId} open={showNetwork} />
    </BottomSheet>
  );
}

function NetworkPanel({ id, open }: { id: string; open: boolean }) {
  return (
    <section
      id={id}
      aria-label="Network"
      inert={!open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute inset-0 flex flex-col overflow-y-auto overscroll-contain border-t bg-background",
        "transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:translate-y-0",
        "data-[state=closed]:invisible data-[state=closed]:translate-y-3 data-[state=closed]:opacity-0",
      )}
    >
      <div className="space-y-5 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Network</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              Slow the fake API down or make it fail, and watch every request the app makes.
            </p>
          </div>
          <ComingSoonBadge />
        </header>

        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Latency
          </h3>
          <LatencyControl className="w-full" />
        </div>

        <FailNextRequestControl className="rounded-xl border px-3 py-2.5" />

        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Requests
          </h3>
          <RequestLog className="rounded-xl border" />
        </div>
      </div>
    </section>
  );
}
