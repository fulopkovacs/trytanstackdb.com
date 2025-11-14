import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boardsTable } from "@/db/schema";
import { requireTempId } from "../middlewares/getTempDbIdFromRequest";

export const getBoards = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return await db
      .select()
      .from(boardsTable)
      .where(eq(boardsTable.tempDbId, tempId));
  });

export const getBoardsQueryOptions = queryOptions({
  queryKey: ["boards"],
  queryFn: getBoards,
});
