import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { todoItemsTable } from "@/db/schema";
import { todoItemUpdateData } from "./api.todo-items";
import { type APIRouteHandler, json } from "./helpers";

const todoItemBatchUpdateData = z.array(todoItemUpdateData);

export default {
  PATCH: async ({ request }) => {
    // Update multiple todo items at once

    let updatedData: z.infer<typeof todoItemUpdateData>[];

    // biome-ignore lint/suspicious/noExplicitAny: it can be any here
    let bodyObj: any;

    try {
      bodyObj = await request.json();
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return new Response(`Invalid JSON body`, { status: 400 });
    }

    try {
      updatedData = todoItemBatchUpdateData.parse(bodyObj);
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

    await db.transaction(async (tx) => {
      for (const todoItemData of updatedData) {
        await tx
          .update(todoItemsTable)
          .set(todoItemData)
          .where(eq(todoItemsTable.id, todoItemData.id));
      }
    });

    return json({ updated: "ok" });
  },
} satisfies APIRouteHandler;
