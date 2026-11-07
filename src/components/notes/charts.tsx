/*
 * The analytics charts, drawn with TanStack Charts. This module is the only
 * one that imports the chart library, and it's only ever loaded lazily
 * (`lazy-charts.tsx`), so the charts' code stays out of the first bundle.
 */
import { barX, barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";

import { DAY_CHART_HEIGHT, folderChartHeight } from "./analytics-data";
import type { DayChartRow, FolderChartRow } from "./analytics-data";

const numberFormat = new Intl.NumberFormat("en-GB");

/** Horizontal bars, one per folder, each labelled with its value. */
export function FolderBarChart({
  rows,
  measure,
}: {
  rows: readonly FolderChartRow[];
  measure: "notes" | "words";
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
      height={folderChartHeight(rows.length)}
      ariaLabel={measure === "notes" ? "Notes per folder" : "Words per folder"}
      ariaDescription={rows
        .map((row) => `${row.name}: ${numberFormat.format(row[measure])} ${measure}`)
        .join(", ")}
    />
  );
}

/** Vertical bars, one per day. */
export function DayBarChart({ rows }: { rows: readonly DayChartRow[] }) {
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
      height={DAY_CHART_HEIGHT}
      ariaLabel="Notes by day of last edit"
      ariaDescription={rows
        .filter((row) => row.notes > 0)
        .map((row) => `${row.label}: ${row.notes}`)
        .join(", ")}
    />
  );
}
