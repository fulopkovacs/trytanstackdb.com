// import { config } from "dotenv";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

// TODO: update based on the environment
const dbName = "idb://try-tanstacdb-local-app";

const client = new PGlite("idb://my-pgdata");

// config();

export const db = drizzle({
  client,
});
