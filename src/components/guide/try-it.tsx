import type { LinkOptions } from "@tanstack/react-router";
import { Check, Play } from "lucide-react";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { useIsSectionDone } from "./guide-store";

/**
 * Opens the app on a section's screen. Provided where the app is out of view
 * (the small-screen layout, where it lives in a sheet); without a provider the
 * guide renders no "Try it" buttons, because the app is already on screen.
 */
export type TryItHandler = (sectionId: string, target: LinkOptions) => void;

const TryItContext = createContext<TryItHandler | null>(null);

export function TryItProvider({
  onTryIt,
  children,
}: {
  onTryIt: TryItHandler;
  children: ReactNode;
}) {
  return <TryItContext value={onTryIt}>{children}</TryItContext>;
}

export function TryItButton({ sectionId, target }: { sectionId: string; target: LinkOptions }) {
  const onTryIt = useContext(TryItContext);
  const done = useIsSectionDone(sectionId);
  if (!onTryIt) return null;

  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={(event) => {
          // Safari doesn't focus buttons on tap; focus it so closing the app returns here.
          event.currentTarget.focus({ preventScroll: true });
          onTryIt(sectionId, target);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-notes-accent pr-4.5 pl-4 text-[15px] font-semibold text-black shadow-sm transition-transform outline-none focus-visible:ring-3 focus-visible:ring-notes-accent/40 active:scale-95"
      >
        <Play className="size-4 fill-current" aria-hidden />
        Try it
      </button>
      {done && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" aria-hidden />
          You did it
        </span>
      )}
    </div>
  );
}
