import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

export const getFirstProjectFromDb = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    const [firstProject] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.tempDbId, tempId))
      .limit(1);
    return firstProject;
  });
