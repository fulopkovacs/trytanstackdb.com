import { useNavigate, useSearch } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
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
  const navigate = useNavigate();

  const isHighlighted =
    searchParams.highlight && highlightId.startsWith(searchParams.highlight);

  useEffect(() => {
    if (!isHighlighted) return;

    const timeout = setTimeout(() => {
      navigate({
        to: ".",
        search: ({ highlight: _, ...old }) => ({ ...old }),
        replace: true,
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isHighlighted, navigate]);

  return (
    <div
      className={cn(
        "outline outline-offset-4 transition-all ease-in-out rounded-sm",
        isHighlighted
          ? "bg-red-500/15 outline-red-500 dark:outline-destructive dark:bg-destructive/10 duration-300"
          : "bg-red-500/0 outline-red-500/0 dark:outline-destructive/0 dark:bg-destructive/0 duration-1000",
        // "outline-destructive bg-destructive/10 outline rounded-sm outline-offset-4",
      )}
    >
      {children}
    </div>
  );
}
