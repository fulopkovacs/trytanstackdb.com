import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { NotImplemented } from "../not-implemented";

type MacButtonProps = ComponentProps<"button"> & {
  /** The feature isn't built: show a not-allowed cursor and a "Not implemented" tooltip. */
  notImplemented?: boolean;
};

/** Shared by the toolbar buttons: hover feedback only for buttons that do something. */
const buttonStates =
  "not-aria-disabled:not-disabled:hover:text-mac-text aria-disabled:cursor-not-allowed disabled:cursor-not-allowed";

function withNotImplemented(button: ReactElement, notImplemented: boolean | undefined) {
  return notImplemented ? <NotImplemented>{button}</NotImplemented> : button;
}

/** The round, slightly raised toolbar buttons of macOS 26. */
export function MacCircleButton({ className, notImplemented, title, ...props }: MacButtonProps) {
  return withNotImplemented(
    <button
      type="button"
      title={notImplemented ? undefined : title}
      aria-disabled={notImplemented || undefined}
      className={cn(
        "grid size-[34px] shrink-0 place-items-center rounded-full border border-mac-control-border bg-mac-control text-mac-icon shadow-[0_1px_1px_rgb(0_0_0/0.03)] transition-colors [&_svg]:size-[17px] [&_svg]:stroke-[1.6]",
        buttonStates,
        className,
      )}
      {...props}
    />,
    notImplemented,
  );
}

/** A capsule that groups several toolbar buttons. */
export function MacPill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-[34px] shrink-0 items-center rounded-full border border-mac-control-border bg-mac-control px-1 text-mac-icon shadow-[0_1px_1px_rgb(0_0_0/0.03)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MacPillButton({ className, notImplemented, title, ...props }: MacButtonProps) {
  return withNotImplemented(
    <button
      type="button"
      title={notImplemented ? undefined : title}
      aria-disabled={notImplemented || undefined}
      className={cn(
        "grid h-[28px] w-[32px] place-items-center rounded-full transition-colors [&_svg]:size-[17px] [&_svg]:stroke-[1.6]",
        buttonStates,
        className,
      )}
      {...props}
    />,
    notImplemented,
  );
}

/** Header row at the top of each column; together they form the window toolbar. */
export function MacColumnHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex h-[52px] shrink-0 items-center gap-2 px-3", className)}>
      {children}
    </div>
  );
}
