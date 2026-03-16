import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";

export const TODO_ITEMS_SYNC_STATE_ID = "todo-items-sync-state";

export type TodoItemsSyncState = {
  id: string;
  unsyncedItemIds: string[];
  inFlightItemIds: string[];
  failedItemIds: string[];
};

const initialTodoItemsSyncState: TodoItemsSyncState[] = [
  {
    id: TODO_ITEMS_SYNC_STATE_ID,
    unsyncedItemIds: [],
    inFlightItemIds: [],
    failedItemIds: [],
  },
];

export const todoItemsSyncCollection = createCollection(
  localOnlyCollectionOptions({
    id: "todo-items-sync",
    getKey: (item) => item.id,
    initialData: initialTodoItemsSyncState,
  }),
);
