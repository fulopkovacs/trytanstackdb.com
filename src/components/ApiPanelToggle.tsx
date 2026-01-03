import { eq, useLiveQuery } from "@tanstack/react-db";
import { ActivityIcon } from "lucide-react";
import { userPreferencesCollection } from "@/collections/UserPreferences";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";
import { USER_PLACEHOLDER } from "@/utils/USER_PLACEHOLDER_CONSTANT";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ApiPanelToggle() {
  const { data: userPreferences } = useLiveQuery((q) =>
    q
      .from({
        userPreferences: userPreferencesCollection,
      })
      .where(({ userPreferences }) =>
        eq(userPreferences.id, USER_PLACEHOLDER.id),
      )
      .findOne(),
  );

  const isOpen = userPreferences?.networkPanel === "open";

  return (
    <HighlightWrapper highlightId="networkPanel_toggle">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOpen ? "default" : "outline"}
            size="icon"
            onClick={() =>
              userPreferencesCollection.update(USER_PLACEHOLDER.id, (draft) => {
                draft.networkPanel =
                  draft.networkPanel === "open" ? "closed" : "open";
              })
            }
            aria-label={isOpen ? "Hide API requests" : "Show API requests"}
          >
            <ActivityIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOpen ? "Hide API requests" : "Show API requests"}</p>
        </TooltipContent>
      </Tooltip>
    </HighlightWrapper>
  );
}
