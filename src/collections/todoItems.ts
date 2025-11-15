import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { TodoItemRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import { getTodoItemsOptions } from "@/server/functions/getTodoItems";

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

export const todoItemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: getTodoItemsOptions.queryKey,
    queryFn: getTodoItems,
    queryClient: TanstackQuery.getContext().queryClient,
    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];

      try {
        await updateTodoItem({
          data: {
            id: original.id,
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
