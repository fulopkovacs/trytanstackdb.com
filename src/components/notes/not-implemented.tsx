import type { ComponentProps, ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Wraps a control whose feature the clone doesn't have (Share, Markup, …) in a
 * "Not implemented" tooltip. Give the control a not-allowed cursor and mark it
 * `aria-disabled`, not `disabled`: disabled elements get no pointer events, so
 * the tooltip would never open.
 */
export function NotImplemented({
  children,
  side,
}: {
  children: ReactElement;
  side?: ComponentProps<typeof TooltipContent>["side"];
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>Not implemented</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
