import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import {
  getProjects,
  getProjectsQueryOptions,
} from "@/server/functions/getProjects";

export const projectsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getProjects,
    queryClient: TanstackQuery.getContext().queryClient,
    getKey: (item) => item.id,
  }),
);
