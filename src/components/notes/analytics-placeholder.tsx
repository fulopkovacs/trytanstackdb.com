import { ChartColumn } from "lucide-react";

/** Analytics is an empty page until phase 4 adds the charts. */
export function AnalyticsPlaceholder() {
  return (
    <div className="flex flex-col items-center px-6 pt-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-notes-accent/15 text-notes-accent">
        <ChartColumn className="size-7" />
      </span>
      <h2 className="mt-4 text-[1.1em] font-semibold">No charts yet</h2>
      <p className="mt-1 max-w-72 text-[0.95em] opacity-60">
        Notes and words per folder, and edits over time, will show up here.
      </p>
    </div>
  );
}
