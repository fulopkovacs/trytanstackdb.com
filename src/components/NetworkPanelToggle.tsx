import { ActivityIcon } from "lucide-react";
import { useNetworkPanel } from "./NetworkRequestsProvider";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function NetworkPanelToggle() {
  const { isOpen, setIsOpen } = useNetworkPanel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOpen ? "default" : "outline"}
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={
            isOpen ? "Hide network requests" : "Show network requests"
          }
        >
          <ActivityIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isOpen ? "Hide network requests" : "Show network requests"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
