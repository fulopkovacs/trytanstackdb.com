import { ScanEye } from "lucide-react";
import type { ReactNode } from "react";

import { useShowSpotlight } from "@/components/spotlight/spotlight";
import { SPOTLIGHT_TARGETS } from "@/components/spotlight/spotlight-targets";
import type { SpotlightTarget } from "@/components/spotlight/spotlight-targets";

/**
 * An inline "look at this" button in the guide's copy: it brings a part of
 * the app on screen and spotlights it. On phones it opens the app sheet
 * first. The text says what's shown; the button's name adds where.
 */
export function ShowMe({ target, children }: { target: SpotlightTarget; children: ReactNode }) {
  const show = useShowSpotlight();
  return (
    <button
      type="button"
      onClick={(event) => {
        // Safari doesn't focus buttons on tap; focus it so closing the app returns here.
        event.currentTarget.focus({ preventScroll: true });
        void show(target);
      }}
      title={`Show the ${SPOTLIGHT_TARGETS[target].label.toLowerCase()} in the app`}
      className="inline-flex items-baseline gap-1 rounded-md border border-guide-accent/35 bg-guide-accent-soft px-1.5 font-medium text-foreground decoration-guide-accent/60 transition-colors outline-none hover:border-guide-accent hover:bg-guide-accent/15 focus-visible:ring-3 focus-visible:ring-guide-accent/40"
    >
      <ScanEye className="size-[0.95em] shrink-0 self-center text-guide-accent" aria-hidden />
      {children}
      <span className="sr-only"> (show in the app)</span>
    </button>
  );
}
