import {
  ChevronDownIcon,
  ChevronRightIcon,
  LoaderIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ApiRequest } from "./ApiRequestsProvider";
import { useApiPanel } from "./ApiRequestsProvider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";

function formatDuration(ms: number | null): string {
  if (ms === null) {
    return "...";
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function getMethodColor(method: ApiRequest["method"]): string {
  switch (method) {
    case "GET":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "POST":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "PATCH":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "DELETE":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getStatusColor(status: number | "pending"): string {
  if (status === "pending") {
    return "text-orange-400";
  }
  if (status >= 200 && status < 300) {
    return "text-green-400";
  }
  if (status >= 400) {
    return "text-red-400";
  }
  return "text-yellow-400";
}

function JsonViewer({ data, label }: { data: unknown; label: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (data === undefined || data === null) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {isOpen ? (
          <ChevronDownIcon className="h-3 w-3" />
        ) : (
          <ChevronRightIcon className="h-3 w-3" />
        )}
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RequestItem({ request }: { request: ApiRequest }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = request.status === "pending";

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] px-1.5 py-0 ${getMethodColor(request.method)}`}
          >
            {request.method}
          </Badge>
          <span className="flex-1 font-mono text-xs truncate">
            {request.pathname}
          </span>
          {isPending ? (
            <LoaderIcon className="h-3 w-3 text-orange-400 animate-spin" />
          ) : (
            <span
              className={`text-xs font-mono ${getStatusColor(request.status)}`}
            >
              {request.status}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {formatDuration(request.duration)}
          </span>
          {isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-xs text-muted-foreground">
            {new Date(request.timestamp).toLocaleTimeString()}
          </div>
          <JsonViewer data={request.requestBody} label="Request Body" />
          {!isPending && (
            <JsonViewer data={request.responseBody} label="Response Body" />
          )}
        </div>
      )}
    </div>
  );
}

export function ApiRequestsPanel() {
  const { requests, clearRequests } = useApiPanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRequestsLengthRef = useRef(requests.length);

  // Auto-scroll to bottom when new requests are added
  if (prevRequestsLengthRef.current !== requests.length) {
    prevRequestsLengthRef.current = requests.length;
    // Schedule scroll after render
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector(
          '[data-slot="scroll-area-viewport"]',
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 0);
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">API Requests</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {requests.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearRequests}
          disabled={requests.length === 0}
        >
          <Trash2Icon />
          <span className="sr-only">Clear requests</span>
        </Button>
      </div>

      {/* Request list */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-sm text-muted-foreground">No requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              API requests will appear here
            </p>
          </div>
        ) : (
          <div>
            {requests.map((request) => (
              <RequestItem key={request.id} request={request} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
