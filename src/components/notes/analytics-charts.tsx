import { barX, barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { localDay, useEditsPerDay, useFolderStats, useFolders } from "@/db/queries";
import { cn } from "@/lib/utils";

import { RECENT_DAYS, folderChartRows, recentDayRows } from "./analytics-data";
import type { DayChartRow, FolderChartRow } from "./analytics-data";

const numberFormat = new Intl.NumberFormat("en-GB");

/**
 * The live analytics rows: notes and words per folder, and notes by day of
 * last edit. Both come from `groupBy` live queries, so they change as you
 * type.
 */
export function useAnalyticsRows() {
  const folders = useFolders();
  const perFolder = useFolderStats();
  const perDay = useEditsPerDay();
  const folderRows = useMemo(() => folderChartRows(folders, perFolder), [folders, perFolder]);
  const days = useMemo(() => recentDayRows(perDay, localDay(new Date().toISOString())), [perDay]);
  return { folderRows, days };
}

/** The Analytics page: three charts drawn with TanStack Charts. */
export function AnalyticsCharts({ variant }: { variant: "mac" | "ios" }) {
  const { folderRows, days } = useAnalyticsRows();
  const card =
    variant === "ios"
      ? "rounded-[26px] bg-ios-card px-4 pt-3 pb-2"
      : "rounded-xl border border-mac-separator bg-black/[0.025] px-4 pt-3 pb-2 dark:bg-white/[0.04]";

  return (
    <div
      data-spotlight="analytics"
      className={cn("space-y-6", variant === "ios" ? "text-[15px]" : "text-[13px]")}
    >
      <div className={cn("grid gap-6", variant === "mac" && "@3xl/notes:grid-cols-2")}>
        <ChartCard title="Notes per folder" className={card}>
          <FolderBarChart rows={folderRows} measure="notes" />
        </ChartCard>
        <ChartCard title="Words per folder" className={card}>
          <FolderBarChart rows={folderRows} measure="words" />
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
      >
        <DayBarChart rows={days.rows} />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  caption,
  className,
  children,
}: {
  title: string;
  caption?: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="mb-1.5 px-4 text-[0.85em] font-semibold tracking-wide uppercase opacity-55">
        {title}
      </h2>
      <div className={cn("analytics-chart", className)}>{children}</div>
      {caption && <p className="mt-1.5 px-4 text-[0.85em] opacity-55">{caption}</p>}
    </section>
  );
}

/** Horizontal bars, one per folder, each labelled with its value. */
export function FolderBarChart({
  rows,
  measure,
  height,
}: {
  rows: readonly FolderChartRow[];
  measure: "notes" | "words";
  height?: number;
}) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(rows, {
            x: measure,
            y: "name",
            key: "folderId",
            radius: { end: 4 },
            maxThickness: 22,
          }),
          text(rows, {
            x: measure,
            y: "name",
            key: "folderId",
            text: (row) => numberFormat.format(row[measure]),
            anchor: "start",
            dx: 6,
            fontSize: 11,
            fill: "currentColor",
          }),
        ],
        scales: {
          x: { scale: scaleLinear, nice: true, axis: false },
          y: {
            scale: () => scaleBand().padding(0.25),
            axis: { line: false, ticks: { size: 0 }, tickLabels: { fontSize: 12 } },
          },
        },
        svgAnimation: true,
        tooltip,
      }),
    [rows, measure],
  );

  return (
    <Chart
      definition={definition}
      height={height ?? rows.length * 30 + 12}
      ariaLabel={measure === "notes" ? "Notes per folder" : "Words per folder"}
      ariaDescription={rows
        .map((row) => `${row.name}: ${numberFormat.format(row[measure])} ${measure}`)
        .join(", ")}
    />
  );
}

/** Vertical bars, one per day. */
function DayBarChart({ rows }: { rows: readonly DayChartRow[] }) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [barY(rows, { x: "label", y: "notes", key: "day", radius: { end: 3 } })],
        scales: {
          x: {
            scale: () => scaleBand().padding(0.2),
            axis: { line: false, ticks: { size: 0 } },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: { strokeOpacity: 0.12 },
            axis: { line: false, ticks: { size: 0, format: (value) => String(value) } },
          },
        },
        svgAnimation: true,
        tooltip,
      }),
    [rows],
  );

  return (
    <Chart
      definition={definition}
      height={180}
      ariaLabel="Notes by day of last edit"
      ariaDescription={rows
        .filter((row) => row.notes > 0)
        .map((row) => `${row.label}: ${row.notes}`)
        .join(", ")}
    />
  );
}
