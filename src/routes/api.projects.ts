import { createFileRoute } from "@tanstack/react-router";
import { getTempDbIdFromRequest } from "@/server/middlewares/getTempDbIdFromRequest";
import { json } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { projectErrorNames } from "@/utils/errorNames";

const projectUpdateData = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  itemPositionsInTheProject: z
    .record(z.string(), z.array(z.string()))
    .optional(),
});

export const Route = createFileRoute("/api/projects")({
  server: {
    middleware: [getTempDbIdFromRequest],
    handlers: {
      GET: async ({ context: { tempId } }) => {
        const results = await db
          .select()
          .from(projectsTable)
          .where(eq(projectsTable.tempDbId, tempId));

        return json(results);
      },
      PATCH: async ({ context, request }) => {
        const tempId = context.tempId;

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
            .where(
              and(
                eq(projectsTable.id, updatedData.id),
                eq(projectsTable.tempDbId, tempId),
              ),
            );
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
    },
  },
});
