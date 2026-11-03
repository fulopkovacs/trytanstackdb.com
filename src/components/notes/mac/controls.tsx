import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The round, slightly raised toolbar buttons of macOS 26. */
export function MacCircleButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-[34px] shrink-0 place-items-center rounded-full border border-mac-control-border bg-mac-control text-mac-icon shadow-[0_1px_1px_rgb(0_0_0/0.03)] transition-colors hover:text-mac-text [&_svg]:size-[17px] [&_svg]:stroke-[1.6]",
        className,
      )}
      {...props}
    />
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

export function MacPillButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "grid h-[28px] w-[32px] place-items-center rounded-full transition-colors hover:text-mac-text [&_svg]:size-[17px] [&_svg]:stroke-[1.6]",
        className,
      )}
      {...props}
    />
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
