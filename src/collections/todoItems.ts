import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getProjectsQueryOptions } from "@/server/functions/getProjects";
import { getTodoItems } from "@/server/functions/getTodoItems";

export const todoItemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getTodoItems,
    queryClient: TanstackQuery.getContext().queryClient,
    getKey: (item) => item.id,
  }),
);
