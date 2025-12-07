import { createIsomorphicFn } from "@tanstack/react-start";
import { type ZodDefault, type ZodNumber, z } from "zod";
import { steps } from "@/data/tutorial";
import { getTutorialDataFromCookie } from "@/server/functions/getTutorialDataFromCookie";

export type TutorialData = {
  isClosed: boolean;
  tutorialStep: string | null;
  scrollPositions: Record<string, number>;
  windowSize: {
    width: number;
    height: number;
  };
};

type TutorialDataHandlers = {
  tutorialData: TutorialData;
  updateTutorialData: (data: Partial<TutorialData>) => Promise<void>;
};

const TUTORIAL_DATA_LOCAL_STORAGE_KEY = "tutorialData";
export const TUTORIAL_COOKIE_NAME = "tutorialCookie";

function parseTutorialDataString(
  tutorialData: string | null | undefined,
): TutorialData {
  let jsonObj = {};
  if (tutorialData) {
    try {
      jsonObj = JSON.parse(tutorialData);
    } catch (e) {
      console.error("Error parsing tutorial data from cookie:", e);
      jsonObj = {};
    }
  }

  const data = tutorialDataSchema.parse(jsonObj);
  return data;
}

export const tutorialDataSchema = z
  .object({
    isClosed: z.boolean().default(false),
    tutorialStep: z.string().default(steps[0].title),
    windowSize: z
      .object({
        width: z.number().default(0),
        height: z.number().default(0),
      })
      .default({ width: 0, height: 0 }),
    scrollPositions: z
      .object(
        steps.reduce(
          (acc, step) => {
            acc[step.title] = z.number().default(0);
            return acc;
          },
          {} as Record<string, ZodDefault<ZodNumber>>,
        ),
      )
      .catch({}),
  })
  .catch({
    isClosed: false,
    tutorialStep: steps[0].title,
    scrollPositions: {},
    windowSize: { width: 0, height: 0 },
  });

export const getTutorialDataHandlers = createIsomorphicFn()
  .server(async (): Promise<TutorialDataHandlers> => {
    // get data from cookie
    const tutorialDataString = await getTutorialDataFromCookie();
    return {
      updateTutorialData: async (data: Partial<TutorialData>) => {
        /**
          Currently, there is no data in TutorialData that
          needs to be updated on the server side.
        */
        throw new Error("Not implemented on server");
      },
      tutorialData: parseTutorialDataString(tutorialDataString),
    };
  })
  .client(async (): Promise<TutorialDataHandlers> => {
    // get data from localStorage, write to cookie via server fn

    const tutorialInLocalStorage = localStorage.getItem(
      TUTORIAL_DATA_LOCAL_STORAGE_KEY,
    );

    return {
      tutorialData: parseTutorialDataString(tutorialInLocalStorage),
      updateTutorialData: async (data: Partial<TutorialData>) => {
        const existingDataString = localStorage.getItem(
          TUTORIAL_DATA_LOCAL_STORAGE_KEY,
        );
        const existingData = parseTutorialDataString(existingDataString);
        const updatedDataString = JSON.stringify({
          ...existingData,
          ...data,
        });

        localStorage.setItem(
          TUTORIAL_DATA_LOCAL_STORAGE_KEY,
          updatedDataString,
        );

        // TODO: use the Cookie Storage api
        window.document.cookie = `${TUTORIAL_COOKIE_NAME}=${updatedDataString}; path=/;`;
      },
    };
  });
