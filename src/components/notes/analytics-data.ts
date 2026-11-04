import { localDay } from "@/db/queries";
import type { Folder } from "@/db/schema";

/*
 * Turns the analytics live queries' rows (`folderStatsQuery`,
 * `editsPerDayQuery` in `db/queries.ts`) into what the charts draw: folder
 * names, days without edits, the chart's date range. The counting happens in
 * the queries, incrementally.
 */

export interface FolderChartRow {
  folderId: string;
  name: string;
  notes: number;
  words: number;
}

/** One row per folder, in sidebar order; folders without notes count zero. */
export function folderChartRows(
  folders: readonly Pick<Folder, "id" | "name">[],
  stats: readonly { folderId: string; notes: number; words: number | null | undefined }[],
): FolderChartRow[] {
  const byFolder = new Map(stats.map((row) => [row.folderId, row]));
  return folders.map((folder) => {
    const row = byFolder.get(folder.id);
    return {
      folderId: folder.id,
      name: folder.name,
      notes: row?.notes ?? 0,
      words: row?.words ?? 0,
    };
  });
}

export interface DayChartRow {
  /** `YYYY-MM-DD`, local time. */
  day: string;
  /** Short label for the axis, e.g. "3 Nov". */
  label: string;
  notes: number;
}

/** How many days the chart shows, ending today. */
export const RECENT_DAYS = 14;

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * Notes by day of last edit, for the last `days` days (oldest first, days
 * without edits at zero), and how many notes were last edited before that.
 * `today` is a local `YYYY-MM-DD`.
 */
export function recentDayRows(
  perDay: readonly { day: string; notes: number }[],
  today: string,
  days = RECENT_DAYS,
): { rows: DayChartRow[]; earlier: number } {
  const counts = new Map(perDay.map((row) => [row.day, row.notes]));
  const end = new Date(`${today}T12:00`);
  const rows: DayChartRow[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end);
    date.setDate(end.getDate() - offset);
    const day = localDay(date.toISOString());
    rows.push({ day, label: dayLabel.format(date), notes: counts.get(day) ?? 0 });
  }
  const first = rows[0]!.day;
  const earlier = perDay.filter((row) => row.day < first).reduce((sum, row) => sum + row.notes, 0);
  return { rows, earlier };
}
