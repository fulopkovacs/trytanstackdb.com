import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import type { TodoItemRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import type { TodoItemCreateDataType } from "@/local-api/api.todo-items";

async function getTodoItems() {
  const res = await fetch("/api/todo-items", { method: "GET" });

  const todoItems: TodoItemRecord[] = await res.json();

  return todoItems;
}

async function updateTodoItem({
  data,
}: {
  data: Partial<TodoItemRecord> & { id: string };
}) {
  const res = await fetch("/api/todo-items", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update todo item");
  }

  const updatedItem: TodoItemRecord = await res.json();

  return updatedItem;
}

async function insertTodoItem({ data }: { data: TodoItemCreateDataType }) {
  const res = await fetch("/api/todo-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to insert todo item");
  }

  const response: TodoItemRecord = await res.json();

  return response;
}

const todoItemsQueryKey = ["todo-items"];

export const todoItemsCollection = createCollection<TodoItemRecord>(
  queryCollectionOptions({
    queryKey: todoItemsQueryKey,
    queryFn: getTodoItems,
    queryClient: TanstackQuery.getContext().queryClient,
    onInsert: async ({ transaction }) => {
      const { modified: newTodoItem } = transaction.mutations[0];

      try {
        await insertTodoItem({
          data: newTodoItem,
        });
      } catch (error) {
        toast.error(`Failed to insert todo item "${newTodoItem.title}"`);
        console.error("Failed to insert todo item:", error);
      }
    },
    onUpdate: async ({ transaction }) => {
      /**
        NOTE: This is a temporary solution for updating todo items.
        **Do not use this in production code!**

        Update strategy:
          1. Optimistically update the local cache when a todo item is moved/updated
          2. Update the server via API call
          3. If the API call fails, refetch the data from the server and revert the local cache

        The server state is only fetched from the server if the update fails.
        Proper synchronization of moving/reordering items requires a sync engine
        to handle client-server conflicts effectively, which is outside the scope
        of this demo app.

        Check out the available built-in sync collections here:
        https://tanstack.com/db/latest/docs/overview#built-in-collection-types
      */

      const { original, changes } = transaction.mutations[0];

      try {
        // Send the updates to the server
        await updateTodoItem({
          data: {
            id: original.id,
            ...changes,
          },
        });

        // If successful, we can keep the optimistic update
        todoItemsCollection.utils.writeUpdate({
          id: original.id,
          ...changes,
        });
      } catch (_) {
        toast.error(`Failed to update todo item "${original.title}"`);

        // Abort all ongoing sync queries
        if (todoItemsCollection.utils.isRefetching === false) {
          // Sync back the server's data
          todoItemsCollection.utils.refetch();
        }
      }

      // Do not sync back the server's data by default
      return {
        refetch: false,
      };
    },
    getKey: (item) => item.id,
  }),
);
