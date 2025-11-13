import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { requireTempId } from "../middlewares/getTempDbIdFromRequest";

export const getProjects = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    // In a real app, you'd fetch boards from a database here
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.tempDbId, tempId));

    return projects;
  });

export const getProjectsQueryOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: getProjects,
});
