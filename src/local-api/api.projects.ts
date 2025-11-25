import { eq } from "drizzle-orm";
import { z } from "zod";
import { projectsTable } from "@/db/schema";
import { projectErrorNames } from "@/utils/errorNames";
import { type APIRouteHandler, json } from "./helpers";
import { db } from "@/db";

const projectUpdateData = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  itemPositionsInTheProject: z
    .record(z.string(), z.array(z.string()))
    .optional(),
});

export type ProjectUpdateData = z.infer<typeof projectUpdateData>;

const handlers = {
  GET: async () => {
    const results = await db.select().from(projectsTable);

    return json(results);
  },
  PATCH: async ({ request }) => {
    let updatedData: z.infer<typeof projectUpdateData>;

    // biome-ignore lint/suspicious/noExplicitAny: it can be any here
    let bodyObj: any;

    try {
      bodyObj = await request.json();
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return new Response(`Invalid JSON body`, { status: 400 });
    }

    try {
      updatedData = projectUpdateData.parse(bodyObj);
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

    try {
      await db
        .update(projectsTable)
        .set(updatedData)
        .where(eq(projectsTable.id, updatedData.id));
    } catch (error) {
      if (
        error instanceof Error &&
        error.cause instanceof Error &&
        updatedData.name &&
        error.cause.message.includes("unique constraint")
      ) {
        return new Response(
          `${projectErrorNames.PROJECT_NAME_EXISTS}: "${updatedData.name}" `,
          { status: 409 },
        );
      }

      console.error("Error updating project:", error);
      return new Response(
        `Error updating project: ${error instanceof Error ? error.message : "unkown error"}`,
        {
          status: 500,
        },
      );
    }

    return json({
      updated: "ok",
    });
  },
} satisfies APIRouteHandler;

export default handlers;
