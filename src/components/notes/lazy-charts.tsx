import { RotateCw } from "lucide-react";
import { Component, Suspense, lazy, useMemo } from "react";
import type { ComponentProps, ComponentType, ErrorInfo, ReactNode } from "react";

import { createStore, useStore } from "@/lib/store";

import { DAY_CHART_HEIGHT, folderChartHeight } from "./analytics-data";
import { chartChunkUrlFrom, createChartsLoader } from "./charts-loader";
import type { DayBarChart, FolderBarChart } from "./charts";

/*
 * The charts, loaded on demand: the first one to render fetches the chart
 * library, and a placeholder of the same height holds its place meanwhile,
 * so nothing jumps when it arrives.
 *
 * If the library can't be fetched (a flaky network, a deploy that removed
 * the old chunk), each chart says so in its own place, with a button to try
 * again; the rest of the page, the guide and the "Show as table" numbers
 * stay. Retrying fetches the module again for every chart at once.
 */

type ChartsModule = typeof import("./charts");

/** The chart module, imported once, and again on "Try again" (see `charts-loader.ts`). */
const loadCharts = createChartsLoader<ChartsModule>({
  importModule: () => import("./charts"),
  importUrl: (url) => import(/* @vite-ignore */ url) as Promise<ChartsModule>,
  chunkUrlFrom: (error) => chartChunkUrlFrom(error, import.meta.url, window.location.origin),
});

/** Bumped by "Try again": every chart makes a fresh lazy component and clears its error. */
const attemptStore = createStore(0);

function retryCharts() {
  attemptStore.set((attempt) => attempt + 1);
}

/** `lazy()` remembers a failure for good, so each attempt gets its own lazy component. */
function useLazyChart<TName extends "FolderBarChart" | "DayBarChart">(name: TName) {
  const attempt = useStore(attemptStore);
  const Chart = useMemo(
    () =>
      lazy(() =>
        loadCharts().then((module) => ({
          default: module[name] as ComponentType<ComponentProps<ChartsModule[TName]>>,
        })),
      ),
    // A new attempt needs a new lazy component.
    [name, attempt],
  );
  return { Chart, attempt };
}

export function LazyFolderBarChart(props: ComponentProps<typeof FolderBarChart>) {
  const { Chart, attempt } = useLazyChart("FolderBarChart");
  const height = folderChartHeight(props.rows.length);
  return (
    <ChartErrorBoundary key={attempt} height={height}>
      <Suspense fallback={<ChartPlaceholder height={height} />}>
        <Chart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
}

export function LazyDayBarChart(props: ComponentProps<typeof DayBarChart>) {
  const { Chart, attempt } = useLazyChart("DayBarChart");
  return (
    <ChartErrorBoundary key={attempt} height={DAY_CHART_HEIGHT}>
      <Suspense fallback={<ChartPlaceholder height={DAY_CHART_HEIGHT} />}>
        <Chart {...props} />
      </Suspense>
    </ChartErrorBoundary>
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

/** Keeps a chart that failed to load (or render) from taking the page down with it. */
class ChartErrorBoundary extends Component<
  { height: number; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("A chart failed to load", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <ChartUnavailable height={this.props.height} />;
  }
}

function ChartUnavailable({ height }: { height: number }) {
  return (
    <div
      style={{ minHeight: Math.min(height, 140) }}
      className="flex flex-col items-center justify-center gap-2 rounded-lg bg-current/5 px-4 py-3 text-center"
    >
      <p className="text-[0.9em] opacity-75">Couldn't load the chart.</p>
      <button
        type="button"
        onClick={retryCharts}
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-current/20 px-3 text-[0.85em] font-medium transition-colors outline-none hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-notes-accent/60"
      >
        <RotateCw className="size-3.5" aria-hidden />
        Try again
      </button>
    </div>
  );
}
