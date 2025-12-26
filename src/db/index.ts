import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const dbName = import.meta.env.DEV
  ? "idb://DEV-trytanstackdb"
  : "idb://trytanstackdb";

/** The name of the IndexedDB database used by PGlite */
export const idbName = `/pglite/${dbName.replace("idb://", "")}`;

export const client = new PGlite(dbName);

export const db = drizzle({
  client,
});

export type DB = typeof db;
