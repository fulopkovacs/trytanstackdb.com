import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HighlightWrapper({
  highlightId,
  children,
  // asChild,
}: {
  highlightId: string;
  children: ReactNode;
  // asChild?: boolean;
}) {
  const searchParams = useSearch({ strict: false });

  return (
    <div
      className={cn(
        searchParams.highlight &&
          highlightId.startsWith(searchParams.highlight) &&
          "outline-red-400 outline",
      )}
    >
      {children}
    </div>
  );
}
