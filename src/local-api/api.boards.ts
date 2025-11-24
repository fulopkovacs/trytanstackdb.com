import { getDb } from "@/db";
import { boardsTable } from "@/db/schema";
import { type APIRouteHandler, json } from "./helpers";

export default {
  GET: async () => {
    const { db } = await getDb();
    const results = await db.select().from(boardsTable);

    return json(results);
  },
} satisfies APIRouteHandler;
