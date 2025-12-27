import { useLiveQuery } from "@tanstack/react-db";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LoaderIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import {
  type ApiRequest,
  apiRequestsCollection,
} from "@/collections/apiRequests";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

async function clearRequests() {
  const ids = (await apiRequestsCollection.toArrayWhenReady()).map(
    ({ id }) => id,
  );
  apiRequestsCollection.delete(ids);
}

function formatDuration(ms: number | null): string {
  if (ms === null) {
    return "...";
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
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
        <pre className="mt-1 whitespace-pre-wrap p-2 bg-muted/50 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
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
            className={cn(
              `font-mono text-[10px] px-1.5 py-0`,
              request.method === "GET"
                ? "bg-blue-100 text-blue-700  border-blue-700/30  dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                : request.method === "POST"
                  ? "bg-green-200 text-green-700 border-green-400 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                  : request.method === "PATCH"
                    ? "bg-yellow-200  text-yellow-700 border-yellow-700/30 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30"
                    : request.method === "DELETE"
                      ? "bg-red-100 text-red-500 border-red-400 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
                      : "bg-gray-200 text-gray-600 border-gray-400 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
            )}
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
              className={cn(
                "text-xs font-mono",
                request.status === "pending"
                  ? "text-orange-400 dark:text-orange-300"
                  : request.status >= 200 && request.status < 300
                    ? "text-green-500 dark:text-green-300"
                    : request.status >= 400
                      ? "text-destructive"
                      : "text-yellow-500 dark:text-yellow-400",
              )}
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
  const { data: requests } = useLiveQuery(
    (q) =>
      q
        .from({
          apiRequest: apiRequestsCollection,
        })
        .orderBy(({ apiRequest }) => apiRequest.timestamp, "desc"),
    [],
  );

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
      <ScrollArea className="flex-1 min-h-0">
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
