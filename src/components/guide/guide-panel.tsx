import { ThemeToggle } from "@/components/theme/theme-toggle";

import { DevGuideMenu } from "./dev-guide-menu";
import { GuideDocument } from "./guide-document";
import { TanStackDbMark } from "./tanstack-db-mark";

/** The guide as a framed panel next to the app (desktop). */
export function GuidePanel() {
  return (
    <div className="@container/guide flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 @md/guide:px-4">
        <TanStackDbMark />
        <span className="hidden truncate text-sm font-semibold tracking-tight @md/guide:inline">
          Try TanStack DB
        </span>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {import.meta.env.DEV && <DevGuideMenu />}
          <ThemeToggle />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <GuideDocument />
      </div>
    </div>
  );
}
