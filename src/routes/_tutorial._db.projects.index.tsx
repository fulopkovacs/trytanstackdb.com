import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ProjectRecord } from "@/db/schema";
import { API, getDataFromApi } from "@/local-api";

export const Route = createFileRoute("/_tutorial/_db/projects/")({
  beforeLoad: async () => {
    const [firstProject] = await getDataFromApi<ProjectRecord[]>(
      API["/api/projects"].GET,
    );

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
