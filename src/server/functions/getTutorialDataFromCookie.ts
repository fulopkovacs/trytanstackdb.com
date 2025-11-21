import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
  DEFAULT_TUTORIAL_DATA_VALUE,
  TUTORIAL_COOKIE_NAME,
  type TutorialData,
  tutorialDataSchema,
} from "@/components/tutorial/TutorialWindow";

export const getTutorialDataFromCookie = createServerFn().handler(
  async (): Promise<TutorialData> => {
    const tutorialData = getCookie(TUTORIAL_COOKIE_NAME);

    if (tutorialData) {
      try {
        const data = tutorialDataSchema.parse(
          JSON.parse(tutorialData || DEFAULT_TUTORIAL_DATA_VALUE),
        );
        return data;
      } catch (e) {
        console.error("Error parsing tutorial data from cookie:", e);
      }
    }

    return {
      tutorialStep: null,
      scrollPositions: {},
    };
  },
);
