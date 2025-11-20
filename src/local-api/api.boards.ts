import { db } from "@/db";
import { boardsTable } from "@/db/schema";
import { type APIRouteHandler, json } from "./helpers";

export default {
  GET: async () => {
    const results = await db.select().from(boardsTable);

    return json(results);
  },
} satisfies APIRouteHandler;
