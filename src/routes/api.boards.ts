import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boardsTable } from "@/db/schema";
import { getTempDbIdFromRequest } from "@/server/middlewares/getTempDbIdFromRequest";

export const Route = createFileRoute("/api/boards")({
  server: {
    middleware: [getTempDbIdFromRequest],
    handlers: {
      GET: async ({ context: { tempId } }) => {
        const results = await db
          .select()
          .from(boardsTable)
          .where(eq(boardsTable.tempDbId, tempId));

        return json(results);
      },
    },
  },
});
