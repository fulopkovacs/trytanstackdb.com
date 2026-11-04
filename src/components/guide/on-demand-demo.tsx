import { useLiveQuery } from "@tanstack/react-db";
import { useState } from "react";

import { useRequestLog } from "@/api/request-log";
import { folderNotesQuery } from "@/db/on-demand-notes";
import { useFolders } from "@/db/queries";
import { cn } from "@/lib/utils";

/**
 * Pick a folder, and a live query over `onDemandNotesCollection` asks for its
 * notes. Below, the requests that collection has made to the fake API.
 */
export function OnDemandDemo() {
  const folders = useFolders();
  const [folderId, setFolderId] = useState("work");
  const { data: notes, isLoading } = useLiveQuery({ query: folderNotesQuery(folderId) });
  const requests = useRequestLog().filter((entry) => entry.url.startsWith("/api/notes?"));

  return (
    <div className="my-5 overflow-hidden rounded-xl border text-sm leading-normal">
      <div className="flex flex-wrap gap-1.5 border-b bg-muted/40 p-3 dark:bg-white/[0.03]">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            aria-pressed={folder.id === folderId}
            onClick={() => setFolderId(folder.id)}
            className={cn(
              "h-8 rounded-full border px-3 font-medium transition-colors",
              folder.id === folderId
                ? "border-guide-accent/50 bg-guide-accent-soft text-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {folder.name}
          </button>
        ))}
      </div>
      <div className="grid gap-0 sm:grid-cols-2 sm:divide-x">
        <section className="p-3" aria-live="polite">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Live query result
          </h4>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-muted-foreground">No notes in this folder.</p>
          ) : (
            <ul className="my-0 list-none space-y-1 pl-0">
              {notes.map((note) => (
                <li key={note.id} className="truncate">
                  {note.title || "New Note"}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="border-t p-3 sm:border-t-0">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Requests from this collection
          </h4>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">None yet.</p>
          ) : (
            <ol className="my-0 list-none space-y-1 pl-0 font-mono text-xs">
              {requests
                .slice(-8)
                .reverse()
                .map((entry) => (
                  <li key={entry.id} className="flex gap-2">
                    <span className="text-muted-foreground">{entry.method}</span>
                    <span className="min-w-0 flex-1 break-all">{entry.url}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {entry.state === "pending" ? "…" : entry.status}
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
