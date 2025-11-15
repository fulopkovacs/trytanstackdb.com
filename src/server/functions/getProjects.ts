import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { requireTempId } from "../middlewares/getTempDbIdFromRequest";
import z from "zod";

export const getProjects = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.tempDbId, tempId));
  });

export const getProjectsQueryOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: getProjects,
});

export const updateProject = createServerFn()
  .middleware([requireTempId])
  .inputValidator(
    // Define the input schema as needed
    // For simplicity, using a generic object here
    z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      itemPositionsInTheProject: z
        .record(z.string(), z.array(z.string()))
        .optional(),
    }),
  )
  .handler(async ({ data: { id, ...updatedData }, context: { tempId } }) => {
    const columnsToUpdate = Object.keys(updatedData);

    if (columnsToUpdate.length === 0) {
      throw new Error("No columns to update");
    }

    await db
      .update(projectsTable)
      .set(updatedData)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.tempDbId, tempId)));
  });
