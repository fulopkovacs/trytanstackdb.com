import { Suspense, lazy } from "react";
import type { ComponentProps } from "react";

import { DAY_CHART_HEIGHT, folderChartHeight } from "./analytics-data";
import type { DayBarChart, FolderBarChart } from "./charts";

/*
 * The charts, loaded on demand: the first one to render fetches the chart
 * library, and a placeholder of the same height holds its place meanwhile,
 * so nothing jumps when it arrives.
 */

const loadCharts = () => import("./charts");

const FolderBarChartImpl = lazy(() =>
  loadCharts().then((module) => ({ default: module.FolderBarChart })),
);
const DayBarChartImpl = lazy(() =>
  loadCharts().then((module) => ({ default: module.DayBarChart })),
);

export function LazyFolderBarChart(props: ComponentProps<typeof FolderBarChart>) {
  return (
    <Suspense fallback={<ChartPlaceholder height={folderChartHeight(props.rows.length)} />}>
      <FolderBarChartImpl {...props} />
    </Suspense>
  );
}

export function LazyDayBarChart(props: ComponentProps<typeof DayBarChart>) {
  return (
    <Suspense fallback={<ChartPlaceholder height={DAY_CHART_HEIGHT} />}>
      <DayBarChartImpl {...props} />
    </Suspense>
  );
}

export function ChartPlaceholder({ height }: { height: number }) {
  return (
    <div
      aria-hidden
      style={{ height }}
      className="rounded-lg bg-current/5 motion-safe:animate-pulse"
    />
  );
}
