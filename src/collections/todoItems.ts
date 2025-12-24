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

export async function batchUpdateTodoItem({
  data,
}: {
  data: (Partial<TodoItemRecord> & { id: string })[];
}) {
  const res = await fetch("/api/batch/todo-items", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to batch update todo items");
  }

  await res.json();
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

export const todoItemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todo-items"],
    queryFn: getTodoItems,
    queryClient: TanstackQuery.getContext().queryClient,
    onInsert: async ({ transaction }) => {
      const { modified: newTodoItem } = transaction.mutations[0];

      try {
        await insertTodoItem({
          data: newTodoItem,
        });
      } catch (error) {
        // TODO: handle error
        toast.error(`Failed to insert todo item "${newTodoItem.title}"`);
        console.error("Failed to insert todo item:", error);
      }
    },
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
