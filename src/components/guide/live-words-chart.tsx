import { FolderBarChart, useAnalyticsRows } from "@/components/notes/analytics-charts";

/**
 * Words per folder, drawn in the guide from the same live query as the
 * Analytics page. With the app beside the guide, it moves as you type.
 */
export function LiveWordsChart() {
  const { folderRows } = useAnalyticsRows();
  return (
    <figure className="analytics-chart not-prose my-5 rounded-xl border bg-background/60 px-4 pt-3 pb-2 text-[13px]">
      <figcaption className="mb-1 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
        <span
          className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
          aria-hidden
        />
        Live: words per folder
      </figcaption>
      <FolderBarChart rows={folderRows} measure="words" />
    </figure>
  );
}
