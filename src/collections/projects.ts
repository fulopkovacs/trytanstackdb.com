import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import type { ProjectRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import type { ProjectUpdateData } from "@/local-api/api.projects";
import { projectErrorNames } from "@/utils/errorNames";

export class ProjectsNotFoundFromAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectsNotFoundError";
  }
}

export const projectsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["projects"],
    queryFn: getProjects,
    queryClient: TanstackQuery.getContext().queryClient,
    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      try {
        await updateProject({ original, changes });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith(projectErrorNames.PROJECT_NAME_EXISTS)
        ) {
          toast.error(
            `Couldn't rename "${original.name}" to "${changes.name}", because a project with that name already exists.`,
          );
        } else {
          // TODO: handle error
          console.error("Failed to update todo item:", error);
        }
      }
    },
    getKey: (item) => item.id,
  }),
);

async function getProjects() {
  const res = await fetch("/api/projects");
  if (res.status !== 200) {
    if (res.status === 404) {
      /*
        Sometimes the service worker serving responding to the
        API requests is acting up, causing 404s.
      */
      throw new ProjectsNotFoundFromAPIError("No projects found");
    } else {
      throw new Error("Failed to fetch projects");
    }
  }

  const data: ProjectRecord[] = await res.json();
  return data;
}

async function updateProject({
  changes,
  original,
}: {
  changes: Partial<ProjectRecord>;
  original: ProjectRecord;
}) {
  /*
    NOTE: we're intentionally not using server functions to make
    it easier to inspect the requests in the networks panel.
   */

  const res = await fetch("/api/projects", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: original.id,
      ...changes,
    } satisfies ProjectUpdateData),
  });

  if (res.status !== 200) {
    // biome-ignore lint/suspicious/noExplicitAny: it's okay
    const errorData: any = await res.text();
    throw new Error(errorData);
  }
}
