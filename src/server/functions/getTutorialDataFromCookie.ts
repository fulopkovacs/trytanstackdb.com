import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
  TUTORIAL_COOKIE_NAME,
  type TutorialData,
  tutorialDataSchema,
} from "@/components/tutorial/TutorialWindow";

export const getTutorialDataFromCookie = createServerFn().handler(
  async (): Promise<TutorialData> => {
    const tutorialData = getCookie(TUTORIAL_COOKIE_NAME);

    try {
      const data = tutorialDataSchema.parse(JSON.parse(tutorialData || "{}"));
      return data;
    } catch (e) {
      console.error("Error parsing tutorial data from cookie:", e);
      return {
        tutorialStep: null,
        scrollPositions: {},
      };
    }
  },
);
