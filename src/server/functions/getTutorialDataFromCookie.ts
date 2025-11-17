import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { TUTORIAL_COOKIE_NAME } from "@/components/tutorial/TutorialWindow";

export const getTutorialDataFromCookie = createServerFn().handler(
  async (): Promise<{ tutorialStep: string | null }> => {
    const tutorialStep = getCookie(TUTORIAL_COOKIE_NAME);
    // Placeholder implementation
    // In a real implementation, you would extract the tutorial data from cookies
    return {
      tutorialStep: tutorialStep || null,
    };
  },
);
