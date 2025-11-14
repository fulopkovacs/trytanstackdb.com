import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
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
  queryFn: getTodoItems,
});
