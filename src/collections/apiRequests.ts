import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";

export type ApiRequest = {
  id: string;
  timestamp: number;
  method: "GET" | "PATCH" | "POST" | "DELETE";
  pathname: string;
  requestBody?: unknown;
  responseBody?: unknown;
  search?: string;
  status: number | "pending";
  duration: number | null; // null when pending
};

export const apiRequestsCollection = createCollection(
  localOnlyCollectionOptions({
    id: "apiRequests",
    getKey: (item) => item.id,
    initialData: [] as ApiRequest[],
    // onUpdate: async ({ transaction }) => {
    //   // Custom logic before confirming the update
    //   const { original, modified } = transaction.mutations[0];
    //   console.log("Updating from", original, "to", modified);
    // },
  }),
);
