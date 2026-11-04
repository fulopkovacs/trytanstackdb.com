import { useForm } from "@tanstack/react-form";
import { isNull, useLiveQuery } from "@tanstack/react-db";
import type { InitialQueryBuilder } from "@tanstack/react-db";
import type { Transaction } from "@tanstack/react-db";
import { Check, CircleDashed, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStreamLog } from "@/api/fake-realtime";
import { useRequestLog } from "@/api/request-log";
import { realtimeNotesCollection } from "@/db/realtime-notes";
import { noteDisplayTitle } from "@/lib/notes/note-body";
import { cn } from "@/lib/utils";

/**
 * The note the demo renames: the oldest one that isn't deleted. It's shared
 * with the Notes app (same fake API), so it can be deleted there; then the
 * demo moves on to the next one.
 */
export function demoNoteQuery(q: InitialQueryBuilder) {
  return q
    .from({ note: realtimeNotesCollection })
    .where(({ note }) => isNull(note.deletedAt))
    .orderBy(({ note }) => note.createdAt, "asc")
    .orderBy(({ note }) => note.id, "asc")
    .findOne();
}

interface Run {
  noteId: string;
  tx: Transaction;
  startedAt: number;
  title: string;
  outcome: "pending" | "completed" | "failed";
  error?: string;
}

/**
 * Rename one note through the simulated Realtime collection and watch each
 * step: the optimistic change, the API's txid, the wait, the stream, and the
 * hand-off to synced data.
 */
export function RealtimeDemo() {
  const { data: note, isReady } = useLiveQuery({ query: demoNoteQuery });
  const [run, setRun] = useState<Run | null>(null);
  const requests = useRequestLog();
  const stream = useStreamLog();

  const form = useForm({
    defaultValues: { title: "" },
    onSubmit: ({ value, formApi }) => {
      const title = value.title.trim();
      if (!title || !note) return;
      const tx = realtimeNotesCollection.update(note.id, (draft) => {
        draft.title = title;
      });
      const started: Run = {
        noteId: note.id,
        tx,
        startedAt: Date.now(),
        title,
        outcome: "pending",
      };
      setRun(started);
      formApi.reset();
      tx.when("settled").then(
        () =>
          setRun((current) =>
            current?.tx === tx ? { ...current, outcome: "completed" } : current,
          ),
        (error: unknown) =>
          setRun((current) =>
            current?.tx === tx
              ? {
                  ...current,
                  outcome: "failed",
                  error: error instanceof Error ? error.message : String(error),
                }
              : current,
          ),
      );
    },
  });

  const patch = run
    ? [...requests]
        .reverse()
        .find(
          (entry) =>
            entry.url === `/api/live/notes/${run.noteId}` && entry.startedAt >= run.startedAt - 5,
        )
    : undefined;
  const txid = (patch?.responseBody as { txid?: string } | null)?.txid;
  const delivered =
    txid !== undefined &&
    stream.some(({ message }) => message.type === "changes" && message.txid === txid);

  type StepState = "todo" | "active" | "done" | "failed";
  const failed = run?.outcome === "failed";
  const steps: { label: ReactNode; state: StepState }[] = run
    ? [
        { label: <>Optimistic update: the new title shows at once</>, state: "done" },
        {
          label: txid ? (
            <>
              <code>PATCH /api/live/notes/{run.noteId}</code> answered{" "}
              <code>{`{ txid: "${txid}" }`}</code>
            </>
          ) : (
            <>
              <code>onUpdate</code> sends <code>PATCH /api/live/notes/{run.noteId}</code>
            </>
          ),
          state: txid ? "done" : failed ? "failed" : "active",
        },
        {
          label: (
            <>
              <code>awaitTxId({txid ? `"${txid}"` : "txid"})</code>: waiting for the stream
            </>
          ),
          state: delivered ? "done" : txid ? "active" : "todo",
        },
        {
          label: <>The stream delivers transaction {txid ?? "…"} with the saved row</>,
          state: delivered ? "done" : "todo",
        },
        {
          label: failed ? (
            <>Rolled back: {run.error}</>
          ) : (
            <>Transaction completed: the synced row replaces the optimistic copy</>
          ),
          state: run.outcome === "completed" ? "done" : failed ? "failed" : "todo",
        },
      ]
    : [];

  return (
    <div className="my-5 overflow-hidden rounded-xl border text-sm leading-normal">
      <div className="space-y-3 border-b bg-muted/40 p-3 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Simulation · not @neon/realtime-tanstack
        </p>
        {!isReady ? (
          <p className="text-muted-foreground" role="status">
            Loading notes…
          </p>
        ) : !note ? (
          <p className="text-muted-foreground" role="status">
            There are no notes left to rename. Create a note in the Notes app, then come back here.
          </p>
        ) : (
          <>
            <p>
              Note title:{" "}
              <strong className={cn(run?.outcome === "pending" && "text-guide-accent")}>
                {noteDisplayTitle(note.title)}
              </strong>
              {run?.outcome === "pending" && (
                <span className="ml-2 text-xs text-muted-foreground">(optimistic)</span>
              )}
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
            >
              <form.Field name="title">
                {(field) => (
                  <>
                    <label htmlFor="realtime-demo-title" className="sr-only">
                      New title
                    </label>
                    <Input
                      id="realtime-demo-title"
                      placeholder="New title"
                      autoComplete="off"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="bg-background"
                    />
                  </>
                )}
              </form.Field>
              <Button type="submit">Rename</Button>
            </form>
          </>
        )}
      </div>
      <ol className="my-0 list-none space-y-2 p-3 pl-3">
        {steps.length === 0 ? (
          <li className="text-muted-foreground">Rename the note to see each step.</li>
        ) : (
          steps.map((step, index) => (
            <li
              key={index}
              className={cn(
                "flex items-start gap-2",
                step.state === "todo" && "text-muted-foreground",
              )}
            >
              <StepIcon state={step.state} />
              <span className="min-w-0 break-words [&_code]:text-[0.85em]">{step.label}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

function StepIcon({ state }: { state: "todo" | "active" | "done" | "failed" }) {
  const className = "mt-0.5 size-4 shrink-0";
  if (state === "done")
    return (
      <Check
        className={cn(className, "text-emerald-600 dark:text-emerald-400")}
        aria-label="Done"
      />
    );
  if (state === "failed")
    return <X className={cn(className, "text-destructive")} aria-label="Failed" />;
  if (state === "active")
    return (
      <LoaderCircle
        className={cn(className, "animate-spin text-guide-accent")}
        aria-label="In progress"
      />
    );
  return <CircleDashed className={className} aria-label="Not yet" />;
}
