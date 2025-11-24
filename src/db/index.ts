// import { config } from "dotenv";

export const getDb = async () => {
  if (typeof window === "undefined") {
    throw new Error("PGlite is only supported in the browser environment.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");

  const dbName = import.meta.env.DEV
    ? "idb://DEV-trytanstackdb"
    : "idb://trytanstackdb";

  const client = new PGlite(dbName);

  const db = drizzle({
    client,
  });
  return { db, client };
};

export type DB = Awaited<ReturnType<typeof getDb>>["db"];
