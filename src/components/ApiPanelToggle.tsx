import { ActivityIcon } from "lucide-react";
import { useApiPanel } from "./ApiRequestsProvider";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ApiPanelToggle() {
  const { isOpen, setIsOpen } = useApiPanel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOpen ? "default" : "outline"}
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Hide API requests" : "Show API requests"}
        >
          <ActivityIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isOpen ? "Hide API requests" : "Show API requests"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
