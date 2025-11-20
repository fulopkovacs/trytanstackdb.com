import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { projectErrorNames } from "@/utils/errorNames";
import { APIRouteHandler, APIType, json } from "./helpers";

const projectUpdateData = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  itemPositionsInTheProject: z
    .record(z.string(), z.array(z.string()))
    .optional(),
});

const handlers = {
  GET: async () => {
    const results = await db.select().from(projectsTable);

    return json(results);
  },
  PATCH: async ({ request }) => {
    console.log({ request });
    let updatedData: z.infer<typeof projectUpdateData>;

    // biome-ignore lint/suspicious/noExplicitAny: it can be any here
    let bodyObj: any;

    try {
      bodyObj = await request.json();
      // console.log(
      //   `Received PATCH /api/projects with body: ${JSON.stringify(bodyObj, null, 2)}.`,
      // );
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
        updatedData.name &&
        error.message.includes("UNIQUE constraint failed: projects.name")
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
