import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getProjectsQueryOptions } from "@/server/functions/getProjects";
import { getTodoItems, updateTodoItem } from "@/server/functions/getTodoItems";

export const todoItemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getProjectsQueryOptions.queryKey,
    queryFn: getTodoItems,
    queryClient: TanstackQuery.getContext().queryClient,
    onUpdate: async ({ transaction, collection }) => {
      const { original, changes } = transaction.mutations[0];

      // const allItems = collection.toArray;
      // const oldIndex = original.positionIndexOnBoard;
      // const newIndex = changes.positionIndexOnBoard;

      // update
      try {
        await updateTodoItem({
          data: {
            ...original,
            ...changes,
          },
        });
      } catch (error) {
        // TODO: handle error
        console.error("Failed to update todo item:", error);
      }
    },
    getKey: (item) => item.id,
  }),
);
