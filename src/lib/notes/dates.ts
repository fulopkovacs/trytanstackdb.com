const DAY_MS = 24 * 60 * 60 * 1000;

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long" });
const longDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole calendar days between `date` and `now` (0 = today, 1 = yesterday…). */
export function daysAgo(date: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
}

/** Section headers in the note list, the way Apple Notes groups by date. */
export function dateGroupLabel(date: Date, now: Date): string {
  const days = daysAgo(date, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Previous 7 Days";
  if (days < 30) return "Previous 30 Days";
  if (date.getFullYear() === now.getFullYear()) return monthFormat.format(date);
  return String(date.getFullYear());
}

/** The short date shown before a note's snippet: "20:35", "Yesterday", "Monday", "12/09/2026". */
export function formatListDate(date: Date, now: Date): string {
  const days = daysAgo(date, now);
  if (days <= 0) return timeFormat.format(date);
  if (days === 1) return "Yesterday";
  if (days < 7) return weekdayFormat.format(date);
  return shortDateFormat.format(date);
}

/** The grey, centred timestamp at the top of the editor. */
export function formatEditorDate(date: Date): string {
  return `${longDateFormat.format(date)} at ${timeFormat.format(date)}`;
}

export interface DateGroup<T> {
  label: string;
  items: T[];
}

/** Groups items (already sorted newest first) into consecutive date sections. */
export function groupByDate<T>(items: T[], getDate: (item: T) => Date, now: Date): DateGroup<T>[] {
  const groups: DateGroup<T>[] = [];
  for (const item of items) {
    const label = dateGroupLabel(getDate(item), now);
    const current = groups.at(-1);
    if (current?.label === label) current.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
