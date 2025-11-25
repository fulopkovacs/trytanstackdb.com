import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createClientOnlyFn } from "@tanstack/react-start";
import type { ProjectRecord } from "@/db/schema";

const getFirstProject = createClientOnlyFn(async () => {
  const { API, getDataFromApi } = await import("@/local-api");
  const [firstProject] = await getDataFromApi<ProjectRecord[]>(
    API["/api/projects"].GET,
  );
  console.log({ firstProject });
  return firstProject;
});

export const Route = createFileRoute("/_tutorial/_db/projects/")({
  beforeLoad: async () => {
    const firstProject = await getFirstProject();
    const id = firstProject?.id;

    // if (!id) {
    //   throw notFound();
    // }

    // throw redirect({
    //   to: "/projects/$projectId",
    //   params: {
    //     projectId: id,
    //   },
    // });
  },
  component: () => {
    return (
      <div>
        <button
          className="underline"
          type="button"
          onClick={async () => await getFirstProject()}
        >
          print projects
        </button>
      </div>
    );
  },
  notFoundComponent: () => {
    return <div>No projects were found in the database.</div>;
  },
});
