import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { BoardRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getBoardsQueryOptions } from "@/server/functions/getBoards";

async function getBoards() {
  const res = await fetch("/api/boards");

  if (!res.ok) {
    throw new Error("Failed to fetch boards");
  }

  const data = await res.json();
  return data as BoardRecord[];
}

export const boardCollection = createCollection(
  queryCollectionOptions({
    queryKey: getBoardsQueryOptions.queryKey,
    queryFn: getBoards,
    queryClient: TanstackQuery.getContext().queryClient,
    getKey: (item) => item.id,
  }),
);
