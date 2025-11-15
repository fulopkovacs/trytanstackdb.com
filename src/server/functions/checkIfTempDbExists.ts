import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";

/**
  Returns `true` if a temporary database with the given ID exists, otherwise `false`.
*/
export const checkIfTempDbExists = createServerFn()
  .inputValidator(
    z.object({
      tempDbId: z.string(),
    }),
  )
  .handler(async ({ data: { tempDbId } }) => {
    const result = await db
      .select({ id: tempDbsTable.id })
      .from(tempDbsTable)
      .where(eq(tempDbsTable.id, tempDbId))
      .limit(1);

    return result.length > 0;
  });
