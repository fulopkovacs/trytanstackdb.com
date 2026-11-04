import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { RECENT_DAYS, useAnalyticsRows } from "./analytics-data";
import { LazyDayBarChart, LazyFolderBarChart } from "./lazy-charts";

const numberFormat = new Intl.NumberFormat("en-GB");
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * The Analytics page: three charts drawn with TanStack Charts, each with
 * its exact numbers as a table one click away. The chart library loads when
 * the page first shows (see `lazy-charts.tsx`).
 */
export function AnalyticsCharts({ variant }: { variant: "mac" | "ios" }) {
  const { folderRows, days } = useAnalyticsRows();
  const card =
    variant === "ios"
      ? "rounded-[26px] bg-ios-card px-4 pt-3 pb-2"
      : "rounded-xl border border-mac-separator bg-black/[0.025] px-4 pt-3 pb-2 dark:bg-white/[0.04]";
  const folderTable = (measure: "notes" | "words") => (
    <ChartTable
      columns={["Folder", measure === "notes" ? "Notes" : "Words"]}
      rows={folderRows.map((row) => ({ key: row.folderId, cells: [row.name, row[measure]] }))}
    />
  );

  return (
    <div
      data-spotlight="analytics"
      className={cn("space-y-6", variant === "ios" ? "text-[15px]" : "text-[13px]")}
    >
      <div className={cn("grid gap-6", variant === "mac" && "@3xl/notes:grid-cols-2")}>
        <ChartCard title="Notes per folder" className={card} table={folderTable("notes")}>
          <LazyFolderBarChart rows={folderRows} measure="notes" />
        </ChartCard>
        <ChartCard title="Words per folder" className={card} table={folderTable("words")}>
          <LazyFolderBarChart rows={folderRows} measure="words" />
        </ChartCard>
      </div>
      <ChartCard
        title="Notes by day of last edit"
        className={card}
        caption={`The last ${RECENT_DAYS} days. ${
          days.earlier === 0
            ? "No notes were last edited before that."
            : `${days.earlier} ${days.earlier === 1 ? "note was" : "notes were"} last edited before that.`
        }`}
        table={
          <ChartTable
            columns={["Day", "Notes"]}
            rows={[
              ...days.rows.map((row): ChartTableRow => ({
                key: row.day,
                cells: [dayFormat.format(new Date(`${row.day}T12:00`)), row.notes],
              })),
              { key: "earlier", cells: ["Earlier", days.earlier] },
            ]}
          />
        }
      >
        <LazyDayBarChart rows={days.rows} />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  caption,
  className,
  table,
  children,
}: {
  title: string;
  caption?: string;
  className: string;
  /** The chart's numbers as a table, behind "Show as table". */
  table: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="mb-1.5 px-4 text-[0.85em] font-semibold tracking-wide uppercase opacity-55">
        {title}
      </h2>
      <div className={cn("analytics-chart", className)}>
        {children}
        <details className="group/table -mx-4 border-t border-current/10 px-4 pt-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-1 rounded py-1 text-[0.85em] font-medium opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-notes-accent/60 [&::-webkit-details-marker]:hidden">
            <ChevronRight
              aria-hidden
              className="size-3.5 transition-transform group-open/table:rotate-90 motion-reduce:transition-none"
            />
            Show as table
          </summary>
          {table}
        </details>
      </div>
      {caption && <p className="mt-1.5 px-4 text-[0.85em] opacity-55">{caption}</p>}
    </section>
  );
}

export interface ChartTableRow {
  key: string;
  cells: [label: string, value: number];
}

/** A chart's exact numbers: a label column, then numbers. */
export function ChartTable({
  columns,
  rows,
}: {
  columns: [string, string];
  rows: ChartTableRow[];
}) {
  return (
    <table className="mb-2 w-full border-collapse">
      <thead>
        <tr className="text-left text-[0.85em] opacity-55">
          <th scope="col" className="py-1.5 font-medium">
            {columns[0]}
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            {columns[1]}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-current/10">
        {rows.map(({ key, cells: [label, value] }) => (
          <tr key={key}>
            <th scope="row" className="py-1.5 text-left font-normal">
              {label}
            </th>
            <td className="py-1.5 text-right tabular-nums">{numberFormat.format(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
