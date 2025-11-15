import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import {
  getProjects,
  getProjectsQueryOptions,
  updateProject,
} from "@/server/functions/getProjects";
import { toast } from "sonner";

export const projectsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getProjects,
    queryClient: TanstackQuery.getContext().queryClient,
    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      // Invalidate related collections if needed
      // await boardsCollection.invalidate();
      try {
        await updateProject({
          data: {
            // ...original,
            id: original.id,
            ...changes,
          },
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Project name already exists")
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
