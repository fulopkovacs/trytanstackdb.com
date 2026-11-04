import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { RECENT_DAYS, useAnalyticsRows } from "./analytics-data";
import { LazyDayBarChart, LazyFolderBarChart } from "./lazy-charts";

/**
 * The Analytics page: three charts drawn with TanStack Charts. The chart
 * library loads when the page first shows (see `lazy-charts.tsx`).
 */
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
          <LazyFolderBarChart rows={folderRows} measure="notes" />
        </ChartCard>
        <ChartCard title="Words per folder" className={card}>
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
