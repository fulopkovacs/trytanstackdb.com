import { ThemeToggle } from "@/components/theme/theme-toggle";

import { DevSectionPicker } from "./dev-section-picker";
import { GuideDocument } from "./guide-document";

export function GuidePanel() {
  return (
    <div className="@container/guide flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 @md/guide:px-4">
        <TanStackDbMark />
        <span className="hidden truncate text-sm font-semibold tracking-tight @md/guide:inline">
          Try TanStack DB
        </span>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {import.meta.env.DEV && <DevSectionPicker />}
          <ThemeToggle />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <GuideDocument />
      </div>
    </div>
  );
}

function TanStackDbMark() {
  return (
    <span
      aria-hidden
      className="grid size-6 place-items-center rounded-md bg-guide-accent text-[11px] font-black text-white"
    >
      DB
    </span>
  );
}
