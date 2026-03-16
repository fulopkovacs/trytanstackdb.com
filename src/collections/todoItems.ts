import { createCollection, parseLoadSubsetOptions } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import type { TodoItemRecord } from "@/db/schema";
import * as TanstackQuery from "@/integrations/tanstack-query/root-provider";
import type { TodoItemCreateDataType } from "@/local-api/api.todo-items";
import {
  TODO_ITEMS_SYNC_STATE_ID,
  todoItemsSyncCollection,
} from "./todoItemsSync";

type TodoItemSyncPayload = Pick<
  TodoItemRecord,
  "id" | "boardId" | "priority" | "title" | "description" | "position"
>;

const UNSYNCED_TOAST_ID = "todo-items-unsynced";

const desiredPayloadById = new Map<string, TodoItemSyncPayload>();
const inFlightItemIds = new Set<string>();
const lastSyncedSignatureById = new Map<string, string>();
const retryAttemptById = new Map<string, number>();
const retryTimeoutById = new Map<string, ReturnType<typeof setTimeout>>();
const unsyncedItemIds = new Set<string>();
const failedItemIds = new Set<string>();

function syncStateCollection() {
  todoItemsSyncCollection.update(TODO_ITEMS_SYNC_STATE_ID, (draft) => {
    draft.unsyncedItemIds = [...unsyncedItemIds].sort();
    draft.inFlightItemIds = [...inFlightItemIds].sort();
    draft.failedItemIds = [...failedItemIds].sort();
  });
}

function updateUnsyncedToast() {
  const failedCount = failedItemIds.size;

  if (failedCount === 0) {
    toast.dismiss(UNSYNCED_TOAST_ID);
    return;
  }

  toast.error(
    failedCount === 1
      ? "1 todo change failed to sync. Local state is preserved."
      : `${failedCount} todo changes failed to sync. Local state is preserved.`,
    {
      id: UNSYNCED_TOAST_ID,
      action: {
        label: "Retry now",
        onClick: () => {
          void retryUnsyncedTodoItemsSync();
        },
      },
    },
  );
}

function syncUiIndicators() {
  syncStateCollection();
  updateUnsyncedToast();
}

function buildPayload(item: TodoItemRecord): TodoItemSyncPayload {
  return {
    id: item.id,
    boardId: item.boardId,
    priority: item.priority,
    title: item.title,
    description: item.description,
    position: item.position,
  };
}

function payloadSignature(payload: TodoItemSyncPayload): string {
  return JSON.stringify(payload);
}

function clearRetryTimeout(itemId: string) {
  const timeoutId = retryTimeoutById.get(itemId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    retryTimeoutById.delete(itemId);
  }
}

function getRetryDelayMs(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}

function getTodoItem(itemId: string): TodoItemRecord | undefined {
  return todoItemsCollection.get(itemId);
}

function syncTodoItemsQueryCache(modified: TodoItemRecord) {
  const queryClient = TanstackQuery.getContext().queryClient;
  queryClient.setQueriesData<TodoItemRecord[]>(
    { queryKey: todoItemsQueryKey },
    (oldData) => {
      if (!oldData) {
        return oldData;
      }

      return oldData.map((item) => (item.id === modified.id ? modified : item));
    },
  );
}

function markUnsynced(itemId: string) {
  unsyncedItemIds.add(itemId);
  syncUiIndicators();
}

function markSynced(itemId: string) {
  unsyncedItemIds.delete(itemId);
  failedItemIds.delete(itemId);
  syncUiIndicators();
}

function clearSyncStateForItem(itemId: string) {
  clearRetryTimeout(itemId);
  desiredPayloadById.delete(itemId);
  inFlightItemIds.delete(itemId);
  lastSyncedSignatureById.delete(itemId);
  retryAttemptById.delete(itemId);
  unsyncedItemIds.delete(itemId);
  failedItemIds.delete(itemId);
  syncUiIndicators();
}

async function flushItemSync(itemId: string) {
  if (inFlightItemIds.has(itemId)) {
    return;
  }

  const desiredPayload = desiredPayloadById.get(itemId);

  if (!desiredPayload) {
    clearSyncStateForItem(itemId);
    return;
  }

  const desiredSignature = payloadSignature(desiredPayload);

  if (lastSyncedSignatureById.get(itemId) === desiredSignature) {
    markSynced(itemId);
    return;
  }

  inFlightItemIds.add(itemId);
  syncUiIndicators();

  try {
    await updateTodoItem({ data: desiredPayload });
    lastSyncedSignatureById.set(itemId, desiredSignature);
    retryAttemptById.set(itemId, 0);
  } catch (error) {
    const nextAttempt = (retryAttemptById.get(itemId) ?? 0) + 1;
    retryAttemptById.set(itemId, nextAttempt);
    unsyncedItemIds.add(itemId);
    failedItemIds.add(itemId);
    syncUiIndicators();

    const delay = getRetryDelayMs(nextAttempt);
    const timeoutId = setTimeout(() => {
      retryTimeoutById.delete(itemId);
      void flushItemSync(itemId);
    }, delay);

    retryTimeoutById.set(itemId, timeoutId);

    console.error(`Failed to sync todo item ${itemId}:`, error);
    return;
  } finally {
    inFlightItemIds.delete(itemId);
    syncUiIndicators();
  }

  const latestLocalItem = getTodoItem(itemId);

  if (!latestLocalItem) {
    clearSyncStateForItem(itemId);
    return;
  }

  const latestPayload = buildPayload(latestLocalItem);
  const latestSignature = payloadSignature(latestPayload);

  desiredPayloadById.set(itemId, latestPayload);

  if (lastSyncedSignatureById.get(itemId) !== latestSignature) {
    markUnsynced(itemId);
    void flushItemSync(itemId);
    return;
  }

  markSynced(itemId);
}

function queueLatestSync(itemId: string) {
  const todoItem = getTodoItem(itemId);

  if (!todoItem) {
    clearSyncStateForItem(itemId);
    return;
  }

  clearRetryTimeout(itemId);

  const nextPayload = buildPayload(todoItem);
  desiredPayloadById.set(itemId, nextPayload);

  const nextSignature = payloadSignature(nextPayload);
  const lastSyncedSignature = lastSyncedSignatureById.get(itemId);

  if (lastSyncedSignature !== nextSignature) {
    markUnsynced(itemId);
  }

  void flushItemSync(itemId);
}

export async function retryUnsyncedTodoItemsSync() {
  const idsToRetry = [...failedItemIds];

  idsToRetry.forEach((itemId) => {
    failedItemIds.delete(itemId);
    clearRetryTimeout(itemId);
    retryAttemptById.set(itemId, 0);
    void flushItemSync(itemId);
  });

  syncUiIndicators();

  return idsToRetry.length;
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
    queryFn: async ({ meta }) => {
      const params = new URLSearchParams();

      if (meta) {
        const { where } = meta.loadSubsetOptions;

        // Parse the expressions into simple format
        const parsed = parseLoadSubsetOptions({ where });

        // Build query parameters from parsed filters

        // Add filters
        parsed.filters.forEach(({ field, operator, value }) => {
          const fieldName = field.join(".");

          // Currently only the "eq" operator is supported by our API
          if (operator === "eq") {
            params.set(fieldName, String(value));
          }
        });
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
        throw error;
      }
    },
    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];

      // Keep TanStack Query cache aligned with local optimistic state
      // so switching projects still shows the latest local edits.
      syncTodoItemsQueryCache(modified);

      // Local-first, latest-wins sync queue per item.
      // We never throw here, so local optimistic state is never rolled back.
      queueLatestSync(modified.id);

      return {
        refetch: false,
      };
    },
    getKey: (item) => item.id,
  }),
);
