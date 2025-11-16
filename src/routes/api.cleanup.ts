import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { lte } from "drizzle-orm";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";

export const Route = createFileRoute("/api/cleanup")({
  server: {
    handlers: {
      POST: async () => {
        // remove all expired temp databases

        const removedTempDbs = await db
          .delete(tempDbsTable)
          .where(lte(tempDbsTable.expiryTimestampMs, Date.now()))
          .returning({
            id: tempDbsTable.id,
          });

        return json({
          removedDbIds: removedTempDbs.map((db) => db.id),
        });
      },
    },
  },
});
