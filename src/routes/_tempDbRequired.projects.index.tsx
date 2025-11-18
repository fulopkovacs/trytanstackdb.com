import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFirstProjectFromDb } from "@/server/functions/getFirstProjectFromDb";

export const Route = createFileRoute("/_tempDbRequired/projects/")({
  beforeLoad: async () => {
    const firstProject = await getFirstProjectFromDb();
    const id = firstProject?.id;
    if (!id) {
      throw redirect({
        to: "/",
        search: {
          error:
            "No projects found in the database. Please create a project first.",
        },
      });
    }

    throw redirect({
      to: "/projects/$projectId",
      params: {
        projectId: id,
      },
    });
  },
});
