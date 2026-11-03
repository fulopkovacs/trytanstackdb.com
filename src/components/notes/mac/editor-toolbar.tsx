import {
  ChevronsRight,
  Ellipsis,
  Link as LinkIcon,
  ListChecks,
  Paperclip,
  PenTool,
  Search,
  Share,
  SquarePen,
  Table,
  UserRoundPlus,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useElementWidth } from "@/hooks/use-element-width";
import { cn } from "@/lib/utils";

import { MacCircleButton, MacPill, MacPillButton } from "./controls";
import { FORMAT_ITEMS, planToolbar, TOOLBAR_METRICS } from "./toolbar-plan";
import type { ToolbarItemId } from "./toolbar-plan";

const ITEMS: Record<ToolbarItemId, { label: string; icon: ReactNode }> = {
  format: {
    label: "Format",
    icon: <span className="text-[15px] font-medium tracking-tight">Aa</span>,
  },
  checklist: { label: "Checklist", icon: <ListChecks /> },
  table: { label: "Table", icon: <Table /> },
  attachment: { label: "Attach file", icon: <Paperclip /> },
  markup: { label: "Markup", icon: <PenTool /> },
  link: { label: "Add link", icon: <LinkIcon /> },
  collaborate: { label: "Collaborate", icon: <UserRoundPlus /> },
  share: { label: "Share", icon: <Share /> },
  more: { label: "More", icon: <Ellipsis /> },
};

/**
 * The editor half of the window toolbar. It measures its own width (the app
 * pane is resizable) and collapses items into "»" when they don't fit.
 */
export function EditorToolbar() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const plan = planToolbar(width ?? Number.POSITIVE_INFINITY);
  const shown = (id: ToolbarItemId) => plan.visible.has(id);
  const formatItems = FORMAT_ITEMS.filter(shown);
  const trailingPill = (["share", "more"] as const).filter(shown);

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Note"
      className="grid h-[52px] w-full min-w-0 shrink-0 grid-cols-[minmax(auto,1fr)_auto_minmax(auto,1fr)] items-center"
      style={{ paddingInline: TOOLBAR_METRICS.padding, columnGap: TOOLBAR_METRICS.gap }}
    >
      <div className="flex items-center">
        <MacCircleButton aria-label="New note" title="New note">
          <SquarePen />
        </MacCircleButton>
      </div>

      <div className="flex justify-center">
        {formatItems.length > 0 && (
          <MacPill>
            {formatItems.map((id) => (
              <MacPillButton key={id} aria-label={ITEMS[id].label} title={ITEMS[id].label}>
                {ITEMS[id].icon}
              </MacPillButton>
            ))}
          </MacPill>
        )}
      </div>

      <div className="flex items-center justify-end" style={{ gap: TOOLBAR_METRICS.gap }}>
        {shown("collaborate") && (
          <MacCircleButton aria-label={ITEMS.collaborate.label} title={ITEMS.collaborate.label}>
            {ITEMS.collaborate.icon}
          </MacCircleButton>
        )}
        {trailingPill.length > 0 && (
          <MacPill>
            {trailingPill.map((id) => (
              <MacPillButton key={id} aria-label={ITEMS[id].label} title={ITEMS[id].label}>
                {ITEMS[id].icon}
              </MacPillButton>
            ))}
          </MacPill>
        )}
        {plan.overflow.length > 0 && <OverflowMenu items={plan.overflow} />}
        <SearchControl field={plan.searchField} />
      </div>
    </div>
  );
}

function OverflowMenu({ items }: { items: ToolbarItemId[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MacCircleButton aria-label="More toolbar items" title="More toolbar items">
          <ChevronsRight />
        </MacCircleButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {items.map((id) => (
          <DropdownMenuItem key={id} className="[&_svg]:text-muted-foreground">
            <span className="grid w-5 place-items-center [&>span]:text-xs">{ITEMS[id].icon}</span>
            {ITEMS[id].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchControl({ field }: { field: boolean }) {
  if (!field) {
    return (
      <MacCircleButton aria-label="Search" title="Search">
        <Search />
      </MacCircleButton>
    );
  }
  return (
    <label
      className={cn(
        "flex h-[34px] items-center gap-1.5 rounded-full border border-mac-control-border bg-mac-control px-3 text-mac-icon",
      )}
      style={{ width: TOOLBAR_METRICS.searchField }}
    >
      <Search className="size-[15px] shrink-0" />
      <input
        type="search"
        placeholder="Search"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-mac-text outline-none placeholder:text-mac-text-secondary"
      />
    </label>
  );
}
