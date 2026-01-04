import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod";
import { HomeIntro } from "@/components/HomeIntro";
import { highlightParamSchema } from "@/components/tutorial";
import { TutorialWindow } from "@/components/tutorial/TutorialWindow";
import { getShowIntro } from "@/utils/getShowIntro";
import { getTutorialDataHandlers } from "@/utils/getTutorialDataHandlers";

export const Route = createFileRoute("/_tutorial")({
  validateSearch: z
    .object({
      temp_db_missing: z.string().optional(),
      article: z.string().optional(),
    })
    .extend(highlightParamSchema.shape),
  loader: async () => {
    const { tutorialData } = await getTutorialDataHandlers();
    const { showIntroState } = getShowIntro();
    return {
      tutorialData,
      showIntroState,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tutorialData, showIntroState } = Route.useLoaderData();

  return (
    <>
      <Outlet />
      <HomeIntro
        activeStep={tutorialData.tutorialStep}
        showIntro={showIntroState === "visible"}
      />
      <TutorialWindow tutorialData={tutorialData} />
    </>
  );
}
