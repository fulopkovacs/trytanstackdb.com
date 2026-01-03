import {
  createCollection,
  type IR,
  parseLoadSubsetOptions,
} from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import type { TodoItemRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import type { TodoItemCreateDataType } from "@/local-api/api.todo-items";

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
    queryFn: async ({ meta }) => {
      const params = new URLSearchParams();

      if (meta) {
        const { limit, offset, where, orderBy } = meta.loadSubsetOptions as {
          where?: IR.BasicExpression<boolean>;
          orderBy?: IR.OrderBy;
          offset?: IR.Offset;
          limit?: number;
        };

        // Parse the expressions into simple format
        const parsed = parseLoadSubsetOptions({ where, orderBy, limit });

        // Build query parameters from parsed filters

        // Add filters
        parsed.filters.forEach(({ field, operator, value }) => {
          const fieldName = field.join(".");
          if (operator === "eq") {
            params.set(fieldName, String(value));
          } else if (operator === "lt") {
            params.set(`${fieldName}_lt`, String(value));
          } else if (operator === "gt") {
            params.set(`${fieldName}_gt`, String(value));
          } else if (operator === "in" && Array.isArray(value)) {
            // Handle inArray - join values with comma
            params.set(`${fieldName}_in`, value.join(","));
          }
        });

        // Add sorting
        if (parsed.sorts.length > 0) {
          const sortParam = parsed.sorts
            .map((s) => `${s.field.join(".")}:${s.direction}`)
            .join(",");
          params.set("sort", sortParam);
        }

        // Add limit
        if (parsed.limit) {
          params.set("limit", String(parsed.limit));
        }

        // Add offset for pagination
        if (offset) {
          params.set("offset", String(offset));
        }
      }

      const res = await fetch(`/api/todo-items?${params}`, { method: "GET" });

      const todoItems: TodoItemRecord[] = await res.json();

      return todoItems;
    },
    queryClient: TanstackQuery.getContext().queryClient,
    syncMode: "on-demand",
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

        // Update the TanStack Query cache so switching projects shows correct data
        const queryClient = TanstackQuery.getContext().queryClient;
        queryClient.setQueriesData<TodoItemRecord[]>(
          { queryKey: todoItemsQueryKey },
          (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((item) =>
              item.id === original.id ? { ...item, ...changes } : item,
            );
          },
        );
      } catch (_) {
        toast.error(`Failed to update todo item "${original.title}"`);

        // TODO: handle this one later properly
        // with queryClient.invalidateQueries(todoItemsQueryKey);
        // // Do not sync if the collection is already refetching
        // if (todoItemsCollection.utils.isRefetching === false) {
        //   // Sync back the server's data
        //   todoItemsCollection.utils.refetch();
        // }
      }

      // Do not sync back the server's data by default
      return {
        refetch: false,
      };
    },
    getKey: (item) => item.id,
  }),
);
