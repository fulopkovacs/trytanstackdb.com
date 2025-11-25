import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import type { ProjectRecord } from "@/db/schema";
import { API, getDataFromApi } from "@/local-api";

const getFirstProject = createIsomorphicFn().client(async () => {
  const [firstProject] = await getDataFromApi<ProjectRecord[]>(
    API["/api/projects"].GET,
  );
  return firstProject;
});

export const Route = createFileRoute("/_tutorial/_db/projects/")({
  beforeLoad: async () => {
    const firstProject = await getFirstProject();
    const id = firstProject?.id;

    if (!id) {
      throw notFound();
    }

    throw redirect({
      to: "/projects/$projectId",
      params: {
        projectId: id,
      },
    });
  },
  notFoundComponent: () => {
    return <div>No projects were found in the database.</div>;
  },
});
