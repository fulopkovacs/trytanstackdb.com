import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { TUTORIAL_COOKIE_NAME } from "@/utils/getTutorialDataHandlers";

export const getTutorialDataFromCookie = createServerFn().handler(
  async (): Promise<string | undefined> => {
    const tutorialData = getCookie(TUTORIAL_COOKIE_NAME);

    return tutorialData;
  },
);
