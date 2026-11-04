import { ArrowDownUp, ChevronRight, LoaderCircle, Zap } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setNetworkConfig, useNetworkConfig } from "@/api/network-config";
import { useRequestLog } from "@/api/request-log";
import type { RequestLogEntry } from "@/api/request-log";
import { reportAction } from "@/lib/app-actions";
import { cn } from "@/lib/utils";

import { LATENCY_PRESETS, formatDuration, formatLatency } from "./latency";

/*
 * Latency and failure controls for the fake API (`api/network-config.ts`),
 * and the request inspector's list (`api/request-log.ts`). Shared by the
 * desktop browser toolbar and drawer, and by the app sheet's Network view
 * on phones.
 */

export function setLatency(latencyMs: number) {
  setNetworkConfig({ latencyMs });
  reportAction({ type: "network.latency-set", latencyMs });
}

export function setFailNextRequest(failNext: boolean) {
  setNetworkConfig({ failNextRequest: failNext });
  reportAction({ type: "network.fail-next-set", failNext });
}

export function LatencyControl({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "default";
}) {
  const { latencyMs } = useNetworkConfig();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size={size}
      spacing={0}
      value={String(latencyMs)}
      // Picking the selected preset again would clear it; keep it instead.
      onValueChange={(value) => value && setLatency(Number(value))}
      aria-label="API latency"
      className={className}
    >
      {LATENCY_PRESETS.map((ms) => (
        <ToggleGroupItem
          key={ms}
          value={String(ms)}
          aria-label={`${formatLatency(ms)} latency`}
          className="flex-auto tabular-nums group-data-[spacing=0]/toggle-group:px-2.5 data-[state=on]:bg-foreground data-[state=on]:text-background"
        >
          {formatLatency(ms)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A labelled switch (the app sheet's Network view). */
export function FailNextRequestControl({ className }: { className?: string }) {
  const id = useId();
  const descriptionId = useId();
  const { failNextRequest } = useNetworkConfig();
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div>
        <label htmlFor={id} className="text-sm">
          Fail the next request
        </label>
        <p id={descriptionId} className="text-[12px] text-muted-foreground">
          The server answers it with a 500, then works again.
        </p>
      </div>
      <Switch
        id={id}
        aria-describedby={descriptionId}
        checked={failNextRequest}
        onCheckedChange={setFailNextRequest}
        className="data-checked:bg-red-600"
      />
    </div>
  );
}

/** A compact toggle button (the desktop browser toolbar). */
export function FailNextRequestToggle({ className }: { className?: string }) {
  const { failNextRequest } = useNetworkConfig();
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={failNextRequest}
      onPressedChange={setFailNextRequest}
      title="The server answers the next request with a 500, then works again"
      className={cn(
        "gap-1.5 data-[state=on]:border-red-600/40 data-[state=on]:bg-red-600/10 data-[state=on]:text-red-700 dark:data-[state=on]:text-red-400",
        className,
      )}
    >
      <Zap aria-hidden />
      Fail next
    </Toggle>
  );
}

/** The current time, ticking while `active` (for pending requests' elapsed time). */
function useNow(active: boolean, intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs]);
  return now;
}

const COLUMNS = "grid grid-cols-[1rem_3.25rem_minmax(0,1fr)_3.5rem_4rem] items-center gap-2";

/**
 * The request inspector's list: every call to the fake API, newest first,
 * live. A pending request counts up until it settles; expanding a row shows
 * what was sent and what came back.
 */
export function RequestLog({ className }: { className?: string }) {
  const entries = useRequestLog();
  const now = useNow(entries.some((entry) => entry.state === "pending"));

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        aria-hidden
        className={cn(
          COLUMNS,
          "border-b px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
        )}
      >
        <span />
        <span>Method</span>
        <span>URL</span>
        <span className="text-right">Status</span>
        <span className="text-right">Time</span>
      </div>
      {entries.length === 0 ? (
        <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-1 px-6 pb-8 text-center">
          <ArrowDownUp className="mb-1 size-5 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No requests yet</p>
          <p className="max-w-64 text-[13px] text-muted-foreground">
            Every call the app makes to the fake API will show up here, with its status and timing.
          </p>
        </div>
      ) : (
        <ol aria-label="Requests, newest first" className="divide-y">
          {[...entries].reverse().map((entry) => (
            <RequestRow key={entry.id} entry={entry} now={now} />
          ))}
        </ol>
      )}
    </div>
  );
}

function RequestRow({ entry, now }: { entry: RequestLogEntry; now: number }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const pending = entry.state === "pending";
  const elapsed = entry.durationMs ?? Math.max(0, now - entry.startedAt);

  return (
    <li data-state={entry.state} className="relative">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded(!expanded)}
        className={cn(
          COLUMNS,
          "w-full px-3 py-1.5 text-left text-[12px] transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted",
        )}
      >
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none",
            expanded && "rotate-90",
          )}
        />
        <MethodBadge method={entry.method} />
        <span className="truncate font-mono text-[11.5px]" title={entry.url}>
          {entry.url}
        </span>
        <StatusCell entry={entry} />
        <span
          className={cn(
            "text-right font-mono text-[11.5px] tabular-nums",
            pending ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {formatDuration(elapsed)}
        </span>
      </button>
      {pending && entry.latencyMs > 0 && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-guide-accent"
          style={{ transform: `scaleX(${Math.min(1, elapsed / entry.latencyMs)})` }}
        />
      )}
      <div id={detailsId} hidden={!expanded} className="space-y-2 bg-muted/40 px-3 pt-1 pb-3">
        <p className="text-[11.5px] text-muted-foreground">
          {entry.injectedFailure
            ? "Failed on purpose (fail next request). "
            : entry.state === "aborted"
              ? "Cancelled before the server answered. "
              : ""}
          Latency {formatLatency(entry.latencyMs)}
          {entry.durationMs !== null && `, took ${formatDuration(entry.durationMs)}`}.
        </p>
        <Body title="Request body" value={entry.requestBody} empty="No body" />
        <Body
          title="Response body"
          value={entry.responseBody}
          empty={pending ? "Waiting for the server…" : "No body"}
        />
      </div>
    </li>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "w-fit rounded px-1 font-mono text-[10.5px] font-semibold",
        method === "GET" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        method === "POST" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        method === "PATCH" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        method === "PUT" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        method === "DELETE" && "bg-red-500/15 text-red-700 dark:text-red-300",
      )}
    >
      {method}
    </span>
  );
}

function StatusCell({ entry }: { entry: RequestLogEntry }) {
  if (entry.state === "pending") {
    return (
      <span className="flex items-center justify-end gap-1 text-[11.5px] text-guide-accent">
        <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />
        <span className="sr-only">Pending</span>
        <span aria-hidden>…</span>
      </span>
    );
  }
  if (entry.state === "aborted" || entry.status === null) {
    return <span className="text-right text-[11.5px] text-muted-foreground">Aborted</span>;
  }
  const ok = entry.status < 400;
  return (
    <span
      className={cn(
        "text-right font-mono text-[11.5px] font-semibold tabular-nums",
        ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
    >
      {entry.status}
    </span>
  );
}

function Body({ title, value, empty }: { title: string; value: unknown; empty: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {value === undefined || value === null ? (
        <p className="text-[12px] text-muted-foreground italic">{empty}</p>
      ) : (
        <pre className="max-h-48 overflow-auto rounded-md border bg-background p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** How many requests are in flight right now. */
export function usePendingRequestCount(): number {
  return useRequestLog().filter((entry) => entry.state === "pending").length;
}
