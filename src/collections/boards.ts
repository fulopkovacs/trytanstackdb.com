import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getBoards } from "@/server/functions/getBoards";
import { getProjectsQueryOptions } from "@/server/functions/getProjects";

export const boardCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getBoards,
    queryClient: TanstackQuery.getContext().queryClient,
    getKey: (item) => item.id,
  }),
);
