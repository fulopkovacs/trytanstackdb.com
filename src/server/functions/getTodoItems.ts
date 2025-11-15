import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { todoItemsTable } from "@/db/schema";
import { requireTempId } from "../middlewares/getTempDbIdFromRequest";

export const getTodoItems = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return await db
      .select()
      .from(todoItemsTable)
      .where(eq(todoItemsTable.tempDbId, tempId));
  });

export const getTodoItemsOptions = queryOptions({
  queryKey: ["todoItems"],
  // queryFn: getTodoItems,
});

export const updateTodoItem = createServerFn()
  .middleware([requireTempId])
  .inputValidator(
    z.object({
      id: z.string(),
      boardId: z.string().optional(),
    }),
  )
  .handler(async ({ data: { id, ...updatedData }, context: { tempId } }) => {
    const columnsToUpdate = Object.keys(updatedData);

    if (columnsToUpdate.length === 0) {
      throw new Error("No columns to update");
    }

    await db
      .update(todoItemsTable)
      .set(updatedData)
      .where(
        and(eq(todoItemsTable.id, id), eq(todoItemsTable.tempDbId, tempId)),
      );
  });
