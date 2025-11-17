import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

const getFirstProjectFromDb = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    const [firstProject] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.tempDbId, tempId))
      .limit(1);
    return firstProject;
  });

export const Route = createFileRoute("/_tempDbRequired/projects/")({
  beforeLoad: async () => {
    const firstProject = await getFirstProjectFromDb();

    const id = firstProject?.id;

    if (!id) {
      throw redirect({
        to: "/",
        search: {
          error:
            "No projects found in the database. Please create a project first.",
        },
      });
    }

    throw redirect({
      to: "/projects/$projectId",
      params: {
        projectId: id,
      },
    });
  },
});
