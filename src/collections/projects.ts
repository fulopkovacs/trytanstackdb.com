import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import type { ProjectRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getProjectsQueryOptions } from "@/server/functions/getProjects";
import { projectErrorNames } from "@/utils/errorNames";

async function getProjects() {
  const res = await fetch("/api/projects");
  if (res.status !== 200) {
    throw new Error("Failed to fetch projects");
  }

  const data: ProjectRecord[] = await res.json();
  return data;
}

export const projectsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getProjects,
    queryClient: TanstackQuery.getContext().queryClient,
    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      try {
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
          }),
        });

        if (res.status !== 200) {
          // biome-ignore lint/suspicious/noExplicitAny: it's okay
          const errorData: any = await res.text();
          throw new Error(errorData);
        }
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
