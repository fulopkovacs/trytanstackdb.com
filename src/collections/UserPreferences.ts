import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import z from "zod";

const userPreferencesSchema = z.object({
  id: z.string().min(1),
  networkPanel: z.enum(["closed", "open"]).default("closed"),
});

export const userPreferencesCollection = createCollection(
  localStorageCollectionOptions({
    id: "user-preferences",
    storageKey: "app-user-prefs",
    getKey: (item) => item.id,
    schema: userPreferencesSchema,
  }),
);
