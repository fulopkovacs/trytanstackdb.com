import type { ReactNode } from "react";

import { useEditsPerDay, useFolderStats, useFolders } from "@/db/queries";
import { cn } from "@/lib/utils";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const numberFormat = new Intl.NumberFormat("en-GB");

/**
 * The analytics page, as plain tables for now (phase 4 draws them as
 * charts). Both are live `groupBy` queries, so they change as you type.
 */
export function AnalyticsTables({ variant }: { variant: "mac" | "ios" }) {
  const folders = useFolders();
  const perFolder = useFolderStats();
  const perDay = useEditsPerDay();
  const statsByFolder = new Map(perFolder.map((row) => [row.folderId, row]));

  const card =
    variant === "ios"
      ? "rounded-[26px] bg-ios-card"
      : "rounded-xl border border-mac-separator bg-black/[0.025] dark:bg-white/[0.04]";

  return (
    <div className={cn("space-y-6", variant === "ios" ? "text-[17px]" : "text-[13px]")}>
      <StatsTable
        title="Notes and words per folder"
        className={card}
        columns={["Folder", "Notes", "Words"]}
        rows={folders.map((folder) => {
          const stats = statsByFolder.get(folder.id);
          return {
            key: folder.id,
            cells: [folder.name, stats?.notes ?? 0, stats?.words ?? 0],
          };
        })}
      />
      <StatsTable
        title="Notes by day of last edit"
        className={card}
        columns={["Day", "Notes"]}
        rows={perDay.map((row) => ({
          key: row.day,
          cells: [dayFormat.format(new Date(`${row.day}T00:00`)), row.notes],
        }))}
      />
    </div>
  );
}

function StatsTable({
  title,
  className,
  columns,
  rows,
}: {
  title: string;
  className: string;
  columns: string[];
  rows: { key: string; cells: (ReactNode | number)[] }[];
}) {
  return (
    <section>
      <h2 className="mb-1.5 px-4 text-[0.85em] font-semibold tracking-wide uppercase opacity-55">
        {title}
      </h2>
      <div className={cn(className, "overflow-hidden")}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[0.85em] opacity-55">
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cn("px-4 pt-2.5 pb-1.5 font-medium", index > 0 && "text-right")}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mac-separator dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row" className="px-4 py-2 text-left font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={index} className="px-4 py-2 text-right tabular-nums">
                      {typeof cell === "number" ? numberFormat.format(cell) : cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
