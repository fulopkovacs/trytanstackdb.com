import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HighlightWrapper({
  children,
  // asChild,
}: {
  children: ReactNode;
  // asChild?: boolean;
}) {
  const searchParams = useSearch({ strict: false });

  // const Comp = asChild ? children : "div";

  return (
    <div
      className={cn(
        searchParams.highlight === "project_all" && "outline-red-400 outline",
      )}
    >
      {children}
    </div>
  );
}
