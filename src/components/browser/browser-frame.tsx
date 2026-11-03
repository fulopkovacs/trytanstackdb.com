import { ArrowLeft, ArrowRight, Lock, Plus, RotateCw, X } from "lucide-react";
import type { ReactNode } from "react";

import { useBrowserHistory } from "./use-browser-history";

export const FAKE_HOST = "notes.app";

interface BrowserFrameProps {
  /** Shown in the tab. */
  title: string;
  /** Path part of the fake URL, e.g. `/folders/work`. */
  path: string;
  /** Reserved for latency and failure controls (phase 4). */
  controls?: ReactNode;
  children: ReactNode;
}

export function BrowserFrame({ title, path, controls, children }: BrowserFrameProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-browser-frame">
      <TabStrip title={title} />
      <Toolbar path={path} controls={controls} />
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function TabStrip({ title }: { title: string }) {
  return (
    <div className="flex h-10 shrink-0 items-end gap-2 px-3">
      <div className="mr-2 flex h-full items-center gap-2" aria-hidden>
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="relative flex h-8 w-56 min-w-0 items-center gap-2 rounded-t-lg bg-browser-toolbar pr-2 pl-3 text-xs">
        <NotesFavicon />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <X className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <Plus className="mb-2 size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}

function Toolbar({ path, controls }: { path: string; controls?: ReactNode }) {
  const { canGoBack, canGoForward, back, forward, reload } = useBrowserHistory();

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b bg-browser-toolbar px-2">
      <ToolbarButton label="Back" onClick={back} disabled={!canGoBack}>
        <ArrowLeft />
      </ToolbarButton>
      <ToolbarButton label="Forward" onClick={forward} disabled={!canGoForward}>
        <ArrowRight />
      </ToolbarButton>
      <ToolbarButton label="Reload" onClick={reload}>
        <RotateCw />
      </ToolbarButton>
      <AddressBar path={path} />
      <div data-slot="browser-controls" className="flex min-w-0 items-center gap-1 empty:hidden">
        {controls}
      </div>
    </div>
  );
}

function AddressBar({ path }: { path: string }) {
  const fakePath = path === "/" ? "" : path;
  return (
    <div
      className="mx-1 flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-browser-field px-3 text-[13px]"
      aria-label="Address"
      role="textbox"
      aria-readonly
    >
      <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 truncate">
        <span className="text-foreground">{FAKE_HOST}</span>
        <span className="text-muted-foreground">{fakePath}</span>
      </span>
    </div>
  );
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 shrink-0 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-35 disabled:hover:bg-transparent dark:hover:bg-white/10 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function NotesFavicon() {
  return (
    <span
      aria-hidden
      className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-gradient-to-b from-[#ffd54a] to-[#f2b705]"
    >
      <span className="h-[2px] w-2 rounded bg-white/90" />
    </span>
  );
}
