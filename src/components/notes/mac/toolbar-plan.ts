/**
 * Decides which editor toolbar items fit, the way the macOS Notes toolbar
 * collapses: first the search field shrinks to an icon, then items move into
 * a "»" overflow menu, least important first.
 */

export type ToolbarItemId =
  | "format"
  | "checklist"
  | "table"
  | "attachment"
  | "markup"
  | "link"
  | "collaborate"
  | "share"
  | "more";

/** Items in the centred formatting capsule, in display order. */
export const FORMAT_ITEMS = [
  "format",
  "checklist",
  "table",
  "attachment",
  "markup",
  "link",
] as const satisfies ToolbarItemId[];

/** Items on the right of the toolbar, in display order. */
export const TRAILING_ITEMS = ["collaborate", "share", "more"] as const satisfies ToolbarItemId[];

/** Hidden first → hidden last. */
const COLLAPSE_ORDER: ToolbarItemId[] = [
  "more",
  "share",
  "collaborate",
  "markup",
  "attachment",
  "link",
  "table",
  "checklist",
  "format",
];

export const TOOLBAR_METRICS = {
  padding: 12,
  gap: 8,
  circle: 34,
  pillItem: 32,
  pillPadding: 10,
  searchField: 200,
} as const;

export interface ToolbarPlan {
  visible: ReadonlySet<ToolbarItemId>;
  /** Hidden items, in toolbar order, shown in the "»" menu. */
  overflow: ToolbarItemId[];
  searchField: boolean;
}

function pillWidth(items: number): number {
  return items === 0 ? 0 : items * TOOLBAR_METRICS.pillItem + TOOLBAR_METRICS.pillPadding;
}

/** Total width the toolbar needs for a given set of visible items. */
export function toolbarWidth(
  visible: ReadonlySet<ToolbarItemId>,
  { searchField, overflowButton }: { searchField: boolean; overflowButton: boolean },
): number {
  const { padding, gap, circle, searchField: fieldWidth } = TOOLBAR_METRICS;
  const widths = [
    circle, // compose
    pillWidth(FORMAT_ITEMS.filter((id) => visible.has(id)).length),
    visible.has("collaborate") ? circle : 0,
    pillWidth(["share", "more"].filter((id) => visible.has(id as ToolbarItemId)).length),
    overflowButton ? circle : 0,
    searchField ? fieldWidth : circle,
  ].filter((width) => width > 0);
  return padding * 2 + widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
}

const ALL_ITEMS: ToolbarItemId[] = [...FORMAT_ITEMS, ...TRAILING_ITEMS];

export function planToolbar(availableWidth: number): ToolbarPlan {
  const visible = new Set(ALL_ITEMS);

  if (toolbarWidth(visible, { searchField: true, overflowButton: false }) <= availableWidth) {
    return { visible, overflow: [], searchField: true };
  }
  if (toolbarWidth(visible, { searchField: false, overflowButton: false }) <= availableWidth) {
    return { visible, overflow: [], searchField: false };
  }

  for (const id of COLLAPSE_ORDER) {
    visible.delete(id);
    if (toolbarWidth(visible, { searchField: false, overflowButton: true }) <= availableWidth)
      break;
  }

  return {
    visible,
    overflow: ALL_ITEMS.filter((id) => !visible.has(id)),
    searchField: false,
  };
}
