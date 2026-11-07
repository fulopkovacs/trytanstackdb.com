import { markSectionDone } from "@/components/guide/guide-store";
import { matchesAppAction, subscribeToAppActions } from "@/lib/app-actions";
import type { AppActionEvent } from "@/lib/app-actions";

import { GUIDE_SECTIONS } from "./content";
import type { GuideSectionContent } from "./content";

/** The sections whose hands-on step `event` completes. */
export function sectionsDoneBy(
  event: AppActionEvent,
  sections: Pick<GuideSectionContent, "id" | "doneWhen">[] = GUIDE_SECTIONS,
): string[] {
  return sections
    .filter((section) => section.doneWhen?.some((matcher) => matchesAppAction(matcher, event)))
    .map((section) => section.id);
}

/** Marks sections done as the reader does their steps in the app. Returns a stop function. */
export function trackSectionProgress(): () => void {
  return subscribeToAppActions((event) => {
    for (const id of sectionsDoneBy(event)) markSectionDone(id);
  });
}
