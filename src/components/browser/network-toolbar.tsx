import { ArrowDownUp, Timer } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setInspectorOpen, useIsInspectorOpen } from "@/components/network/inspector-store";
import { formatLatency } from "@/components/network/latency";
import {
  FailNextRequestControl,
  FailNextRequestToggle,
  LatencyControl,
  usePendingRequestCount,
} from "@/components/network/network-controls";
import { REQUEST_INSPECTOR_ID } from "@/components/network/request-inspector";
import { useNetworkConfig } from "@/api/network-config";
import { cn } from "@/lib/utils";

/**
 * The fake browser's network controls: latency presets and "fail next
 * request", inline when the toolbar is wide and in a popover when it isn't,
 * plus the button that opens the request inspector under the app.
 */
export function NetworkToolbarControls() {
  return (
    <>
      <div
        data-spotlight="network-controls"
        className="hidden items-center gap-1.5 @3xl/toolbar:flex"
        role="group"
        aria-label="Network"
      >
        <Timer className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <LatencyControl className="bg-background/60" />
        <FailNextRequestToggle />
      </div>
      <NetworkPopover />
      <RequestsButton />
    </>
  );
}

function NetworkPopover() {
  const { latencyMs, failNextRequest } = useNetworkConfig();
  return (
    <Popover>
      <PopoverTrigger
        data-spotlight="network-controls"
        aria-label={`Network: ${formatLatency(latencyMs)} latency${failNextRequest ? ", next request fails" : ""}`}
        className="relative flex h-7 items-center gap-1.5 rounded-md border border-input px-2 text-[12px] font-medium tabular-nums transition-colors hover:bg-muted @3xl/toolbar:hidden"
      >
        <Timer className="size-3.5 text-muted-foreground" aria-hidden />
        {formatLatency(latencyMs)}
        {failNextRequest && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-600"
          />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3 p-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Latency
          </p>
          <LatencyControl className="w-full" />
        </div>
        <FailNextRequestControl />
      </PopoverContent>
    </Popover>
  );
}

function RequestsButton() {
  const open = useIsInspectorOpen();
  const pending = usePendingRequestCount();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={REQUEST_INSPECTOR_ID}
      onClick={() => setInspectorOpen(!open)}
      title={open ? "Hide the request inspector" : "Show every request to the fake API"}
      className={cn(
        "relative flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] font-medium transition-colors",
        open ? "border-foreground bg-foreground text-background" : "border-input hover:bg-muted",
      )}
    >
      <ArrowDownUp className="size-3.5" aria-hidden />
      <span className="hidden @xl/toolbar:inline">Requests</span>
      <span className="sr-only @xl/toolbar:hidden">Requests</span>
      {pending > 0 && (
        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-guide-accent px-1 text-[10px] font-semibold text-white tabular-nums">
          {pending}
          <span className="sr-only"> pending</span>
        </span>
      )}
    </button>
  );
}
