import { ArrowDownUp } from "lucide-react";
import { useId } from "react";

import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNetworkConfig } from "@/api/network-config";
import { cn } from "@/lib/utils";

import { LATENCY_PRESETS, formatLatency } from "./latency";

/*
 * Latency and failure controls for the fake API, plus the request inspector.
 * They show the fake API's settings (`api/network-config.ts`) but stay
 * disabled until phase 4 lets them change it and lists `api/request-log.ts`. They're shared by the
 * app sheet (small screens) and, later, the desktop browser toolbar's
 * controls slot.
 */

/** Phase 4 makes these interactive. */
const NETWORK_CONTROLS_READY = false;

export function LatencyControl({ className }: { className?: string }) {
  const { latencyMs } = useNetworkConfig();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={String(latencyMs)}
      disabled={!NETWORK_CONTROLS_READY}
      aria-label="API latency"
      className={className}
    >
      {LATENCY_PRESETS.map((ms) => (
        <ToggleGroupItem key={ms} value={String(ms)} className="flex-1 tabular-nums">
          {formatLatency(ms)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function FailNextRequestControl({ className }: { className?: string }) {
  const id = useId();
  const { failNextRequest } = useNetworkConfig();
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <label htmlFor={id} className="text-sm">
        Fail the next request
      </label>
      <Switch id={id} checked={failNextRequest} disabled={!NETWORK_CONTROLS_READY} />
    </div>
  );
}

/** Every call to the fake API, newest first. Phase 4 renders `useRequestLog()` here. */
export function RequestLog({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="grid grid-cols-[3.5rem_1fr_3rem_3.5rem] gap-2 border-b px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span>Method</span>
        <span>URL</span>
        <span className="text-right">Status</span>
        <span className="text-right">Time</span>
      </div>
      {/* Phase 4: an <ol> with one row per `useRequestLog()` entry replaces this empty state. */}
      <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-1 px-6 pb-8 text-center">
        <ArrowDownUp className="mb-1 size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No requests yet</p>
        <p className="max-w-64 text-[13px] text-muted-foreground">
          Every call the app makes to the fake API will show up here, with its status and timing.
        </p>
      </div>
    </div>
  );
}

export function ComingSoonBadge() {
  return NETWORK_CONTROLS_READY ? null : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
      Coming in phase 4
    </span>
  );
}
