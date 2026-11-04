import { Trash2, X } from "lucide-react";

import { clearRequestLog, useRequestLog } from "@/api/request-log";
import { useNetworkConfig } from "@/api/network-config";

import { setInspectorOpen, useIsInspectorOpen } from "./inspector-store";
import { formatLatency } from "./latency";
import { RequestLog, usePendingRequestCount } from "./network-controls";

export const REQUEST_INSPECTOR_ID = "request-inspector";

/**
 * The request inspector as a drawer under the app (wide screens): every call
 * to the fake API, live. Opened from the browser toolbar or from the guide.
 */
export function RequestInspectorDrawer() {
  const open = useIsInspectorOpen();
  const count = useRequestLog().length;
  const pending = usePendingRequestCount();
  const { latencyMs } = useNetworkConfig();

  return (
    <section
      id={REQUEST_INSPECTOR_ID}
      aria-label="Request inspector"
      data-spotlight="request-inspector"
      hidden={!open}
      className="flex h-[min(42%,22rem)] min-h-40 shrink-0 flex-col border-t bg-background text-foreground"
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <h2 className="text-[13px] font-semibold">Requests</h2>
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {count} {count === 1 ? "request" : "requests"}
          {pending > 0 && `, ${pending} pending`} · latency {formatLatency(latencyMs)}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <DrawerButton label="Clear the list" onClick={clearRequestLog} disabled={count === 0}>
            <Trash2 />
          </DrawerButton>
          <DrawerButton label="Close the request inspector" onClick={() => setInspectorOpen(false)}>
            <X />
          </DrawerButton>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <RequestLog />
      </div>
    </section>
  );
}

function DrawerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
