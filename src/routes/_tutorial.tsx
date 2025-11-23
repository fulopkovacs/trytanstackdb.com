import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import z from "zod";
import { highlightParamSchema } from "@/components/tutorial";
import {
  TUTORIAL_DATA_LOCAL_STORAGE_KEY,
  type TutorialData,
  TutorialWindow,
  tutorialDataSchema,
} from "@/components/tutorial/TutorialWindow";
import { getTutorialDataFromCookie } from "@/server/functions/getTutorialDataFromCookie";
import { HomeIntro } from "@/components/HomeIntro";

const mockUser = {
  id: "1",
  name: "John Doe",
};

const getTutorialWindowData = createIsomorphicFn()
  .server(async (): Promise<TutorialData> => {
    // Fetch any data needed for the tutorial window on the server
    return await getTutorialDataFromCookie();
  })
  .client((): TutorialData => {
    // TODO: might be unnecessary
    const savedStep = window.localStorage.getItem(
      TUTORIAL_DATA_LOCAL_STORAGE_KEY,
    );

    try {
      const tutorialData = tutorialDataSchema.parse(
        JSON.parse(savedStep || "{}"),
      );
      return tutorialData;
    } catch (e) {
      console.error("Error parsing tutorial data from localStorage:", e);
      return {
        tutorialStep: null,
        scrollPositions: {},
      };
    }
  });

export const Route = createFileRoute("/_tutorial")({
  // component: RouteComponent,
  validateSearch: z
    .object({
      temp_db_missing: z.string().optional(),
      step: z.string().optional(),
      show_home_intro: z.enum(["true", "false"]).optional().catch("false"),
    })
    .extend(highlightParamSchema.shape),
  beforeLoad: async () => {
    // TODO: get tempdb

    return {
      user: mockUser,
    };
  },
  loader: async () => {
    const tutorialData = await getTutorialWindowData();
    return {
      tutorialData,
    };
  },
  // loader: async ({ context }) => {
  //   const { subdomain, apex, protocol } = await getSubdomainAndApexFromHost();
  //
  //   if (subdomain) {
  //     const tempDbExists = await checkIfTempDbExists({
  //       data: { tempDbId: subdomain },
  //     });
  //
  //     if (!tempDbExists) {
  //       // redirect to the apex
  //       // throw new Response("Temporary database not found", { status: 404 });
  //       throw redirect({
  //         href: `${getApexDomainRedirectHref(apex, protocol)}?temp_db_missing=${subdomain}`,
  //       });
  //     }
  //   }
  //
  //   return {
  //     tempDbId: context.tempDbId,
  //   };
  // },
  component: RouteComponent,
});

function RouteComponent() {
  const { tutorialData } = Route.useLoaderData();
  const { show_home_intro } = Route.useSearch();

  return (
    <>
      <Outlet />
      <HomeIntro
        activeStep={tutorialData.tutorialStep}
        show_home_intro={show_home_intro}
      />
      <TutorialWindow tutorialData={tutorialData} />
    </>
  );
}
