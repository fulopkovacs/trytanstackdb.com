// import { config } from "dotenv";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

// TODO: get dbName from the environment variables
const dbName = "idb://try-tanstacdb-local-app";

// async function getDb() {
//   const client = new PGlite(dbName);
//
//   // wait until the db is ready
//   // NOTE: shouldn't be necesseray according to the docs,
//   // because query methods are supposed to wait until the db
//   // is fully initialized
//   // src: https://pglite.dev/docs/api#waitready
//   console.log("waiting for the db to be ready...");
//   console.log({
//     dbReadyBefore: client.ready,
//   });
//   await client.waitReady;
//   console.log("the db is ready");
//   console.log({
//     dbReadyAfter: client.ready,
//   });
//
//   // config();
//
//   return drizzle({
//     client,
//   });
// }

export const client = new PGlite(dbName);

export const db = drizzle({
  client,
});
