import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { HighlightParam } from "@/components/tutorial";
import { cn } from "@/lib/utils";

export function HighlightWrapper({
  highlightId,
  children,
  // asChild,
}: {
  highlightId: Exclude<HighlightParam, undefined>;
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
