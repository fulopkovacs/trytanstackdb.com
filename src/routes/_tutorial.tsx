import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod";
import { HomeIntro } from "@/components/HomeIntro";
import { highlightParamSchema } from "@/components/tutorial";
import { TutorialWindow } from "@/components/tutorial/TutorialWindow";
import { getTutorialDataHandlers } from "@/utils/getTutorialDataHandlers";

const mockUser = {
  id: "1",
  name: "John Doe",
};

export const Route = createFileRoute("/_tutorial")({
  validateSearch: z
    .object({
      temp_db_missing: z.string().optional(),
      step: z.string().optional(),
      show_home_intro: z.enum(["true", "false"]).optional().catch("false"),
    })
    .extend(highlightParamSchema.shape),
  beforeLoad: async () => {
    return {
      user: mockUser,
    };
  },
  loader: async () => {
    const { tutorialData } = await getTutorialDataHandlers();
    return {
      tutorialData,
    };
  },
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
