import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getBoards, getBoardsQueryOptions } from "@/server/functions/getBoards";

export const boardCollection = createCollection(
  queryCollectionOptions({
    queryKey: getBoardsQueryOptions.queryKey,
    queryFn: getBoards,
    queryClient: TanstackQuery.getContext().queryClient,
    getKey: (item) => item.id,
  }),
);
