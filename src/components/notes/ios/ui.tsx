import { createLink, useRouter } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Mic, Search, SquarePen } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { usePreviousPath } from "@/lib/history-tracker";
import { cn } from "@/lib/utils";

/* iOS 26 "Liquid Glass": translucent capsules floating over the content. */
const glass =
  "border border-ios-glass-border bg-ios-glass text-ios-text shadow-[0_6px_24px_rgb(0_0_0/0.12)] backdrop-blur-xl backdrop-saturate-150";

export function GlassCircle({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        glass,
        "grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-[22px]",
        className,
      )}
      {...props}
    />
  );
}

function BackAnchor({ className, href, onClick, ...props }: ComponentProps<"a">) {
  const router = useRouter();
  const previousPath = usePreviousPath();

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        const plainClick = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        // Came here from the parent screen: pop back to it, like a real navigation
        // stack, so history doesn't grow and the parent's scroll is restored.
        if (plainClick && href && previousPath === new URL(href, window.location.href).pathname) {
          event.preventDefault();
          router.history.back();
          return;
        }
        // Opened directly (or from elsewhere): go to the parent screen.
        onClick?.(event);
      }}
      className={cn(glass, "grid size-11 shrink-0 place-items-center rounded-full", className)}
    >
      <ChevronLeft className="size-6 -translate-x-px" strokeWidth={2.2} />
    </a>
  );
}

/**
 * Round floating back button (top left of every pushed screen). A typed router
 * link to the parent screen that pops history when the parent is the previous entry.
 */
export const BackLink = createLink(BackAnchor);

export function GlassPill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn(glass, "flex h-11 items-center rounded-full px-1.5", className)}>
      {children}
    </div>
  );
}

export function GlassPillButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("grid h-11 min-w-11 place-items-center px-2 [&_svg]:size-[21px]", className)}
      {...props}
    />
  );
}

interface IosScreenProps {
  /** `grouped` for lists of inset cards, `plain` for the editor. */
  background?: "grouped" | "plain";
  leading?: ReactNode;
  trailing?: ReactNode;
  bottom?: ReactNode;
  children: ReactNode;
}

/**
 * One full-screen page of the iPhone navigation stack. The floating buttons
 * sit on blurred bars (iOS 26's scroll edge effect), and the content is padded
 * so its first and last rows can always scroll clear of them.
 */
export function IosScreen({
  background = "grouped",
  leading,
  trailing,
  bottom,
  children,
}: IosScreenProps) {
  const grouped = background === "grouped";
  return (
    <div
      className={cn(
        "group/screen relative h-full font-sans text-ios-text",
        // Height of the bottom bar: a 3rem pill, 1rem below it, plus the home indicator.
        "[--ios-bottom-bar:calc(4rem+env(safe-area-inset-bottom))]",
        grouped ? "bg-ios-bg" : "bg-ios-plain",
      )}
    >
      <div
        data-page-scroll
        className={cn(
          "notes-scroll h-full overflow-y-auto px-4 pt-[68px]",
          bottom
            ? "pb-[calc(var(--ios-bottom-bar)+1.5rem)]"
            : "pb-[calc(2rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[68px] mask-b-from-70% backdrop-blur-xl",
          grouped ? "bg-ios-bg/85" : "bg-ios-plain/85",
        )}
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex items-center gap-2">{leading}</div>
        <div className="flex items-center gap-2">{trailing}</div>
      </div>

      {bottom && (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-(--ios-bottom-bar) mask-t-from-50% backdrop-blur-md",
              grouped ? "bg-ios-bg/70" : "bg-ios-plain/70",
            )}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {bottom}
          </div>
        </>
      )}
    </div>
  );
}

export function LargeTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4 px-1">
      <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
      {subtitle && <p className="text-[15px] text-ios-secondary">{subtitle}</p>}
    </header>
  );
}

export function SectionHeader({
  children,
  chevron,
  onToggle,
  open = true,
}: {
  children: ReactNode;
  chevron?: boolean;
  onToggle?: () => void;
  open?: boolean;
}) {
  const content = (
    <>
      <span className="flex-1 text-left">{children}</span>
      {chevron && (
        <ChevronDown
          className={cn("size-5 text-ios-secondary transition-transform", !open && "-rotate-90")}
        />
      )}
    </>
  );
  const className = "flex w-full items-center px-1 pt-6 pb-2.5 text-[21px] font-bold";
  return onToggle ? (
    <button type="button" onClick={onToggle} aria-expanded={open} className={className}>
      {content}
    </button>
  ) : (
    <h2 className={className}>{content}</h2>
  );
}

/** A rounded, inset grouped list card. */
export function InsetCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ul className={cn("overflow-hidden rounded-[26px] bg-ios-card", className)}>{children}</ul>
  );
}

/**
 * A row in an inset card. The separator starts where the text starts
 * (`separatorInset`), like UIKit's inset separators.
 */
export function InsetRow({
  children,
  first,
  separatorInset = 16,
}: {
  children: ReactNode;
  first?: boolean;
  separatorInset?: number;
}) {
  return (
    <li className="relative">
      {!first && (
        <span
          aria-hidden
          className="absolute top-0 right-4 h-px bg-ios-separator"
          style={{ left: separatorInset }}
        />
      )}
      {children}
    </li>
  );
}

export function RowChevron() {
  return <ChevronRight className="size-[18px] shrink-0 text-ios-secondary/70" strokeWidth={2.4} />;
}

/** Bottom bar of list screens: search capsule + round compose button. */
export function SearchAndCompose() {
  return (
    <>
      <label className={cn(glass, "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full px-4")}>
        <Search className="size-5 shrink-0 text-ios-text" />
        <input
          type="search"
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-ios-secondary"
        />
        <Mic className="size-5 shrink-0 text-ios-text" />
      </label>
      <ComposeButton />
    </>
  );
}

export function ComposeButton() {
  return (
    <GlassCircle aria-label="New note" className="size-12">
      <SquarePen />
    </GlassCircle>
  );
}
