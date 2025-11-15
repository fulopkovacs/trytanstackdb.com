import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { todoItemsTable } from "@/db/schema";
import { getTempDbIdFromRequest } from "@/server/middlewares/getTempDbIdFromRequest";

const todoItemUpdateData = z.object({
  id: z.string().min(1),
  boardId: z.string().optional(),
});

export const Route = createFileRoute("/api/todo-items")({
  server: {
    middleware: [getTempDbIdFromRequest],
    handlers: {
      GET: async ({ context: { tempId } }) => {
        const results = await db
          .select()
          .from(todoItemsTable)
          .where(eq(todoItemsTable.tempDbId, tempId));

        return json(results);
      },
      PATCH: async ({ context: { tempId }, request }) => {
        let updatedData: z.infer<typeof todoItemUpdateData>;

        // biome-ignore lint/suspicious/noExplicitAny: it can be any here
        let bodyObj: any;

        try {
          bodyObj = await request.json();
        } catch (e) {
          console.error("Error parsing JSON body:", e);
          return new Response(`Invalid JSON body`, { status: 400 });
        }

        try {
          updatedData = todoItemUpdateData.parse(bodyObj);
        } catch (e) {
          console.error("Validation error:", e);
          if (e instanceof z.ZodError) {
            return new Response(`Invalid request data: ${z.prettifyError(e)}`, {
              status: 400,
            });
          }
          console.error("Bad format", e);
          return new Response(`Validation error`, { status: 400 });
        }

        if (
          Object.keys(updatedData).length === 1 // there keys other than id
        ) {
          return new Response(`No columns to update`, { status: 400 });
        }

        const results = await db
          .update(todoItemsTable)
          .set(updatedData)
          .where(
            and(
              eq(todoItemsTable.id, updatedData.id),
              eq(todoItemsTable.tempDbId, tempId),
            ),
          );

        return json(results);
      },
    },
  },
});
