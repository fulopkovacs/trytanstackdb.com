import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { projectsTable, TodoItemRecord, todoItemsTable } from "@/db/schema";
import { getTempDbIdFromRequest } from "@/server/middlewares/getTempDbIdFromRequest";

const todoItemCreateData = z.object({
  id: z.string().min(1),
  boardId: z.string(),
  priority: z.number().min(0).max(3).int().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAtTimestampMs: z.number().nullable(),
  projectId: z.string(),
  // tempDbId: z.string(),
});

export type TodoItemCreateDataType = z.infer<typeof todoItemCreateData>;

const todoItemUpdateData = z.object({
  id: z.string(),
  boardId: z.string().optional(),
  priority: z.number().nullable().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/todo-items")({
  server: {
    middleware: [getTempDbIdFromRequest],
    handlers: {
      GET: async ({ context: { tempId } }) => {
        const results = await db
          .select()
          .from(todoItemsTable)
          .where(eq(todoItemsTable.tempDbId, tempId));

        return json(results);
      },
      POST: async ({ context: { tempId }, request }) => {
        // Create new todo item
        let newTodoItemData: Omit<
          z.infer<typeof todoItemCreateData>,
          "projectId"
        >;
        let projectId: string;
        // biome-ignore lint/suspicious/noExplicitAny: it can be any here
        let bodyObj: any;

        try {
          bodyObj = await request.json();
        } catch (e) {
          console.error("Error parsing JSON body:", e);
          return new Response(`Invalid JSON body`, { status: 400 });
        }

        try {
          const { projectId: projectIdFromPayload, ...todoItemData } =
            todoItemCreateData.parse(bodyObj);
          projectId = projectIdFromPayload;
          newTodoItemData = todoItemData;
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

        const { description } = newTodoItemData;

        if (!description) {
          return new Response(`Description is required`, { status: 400 });
        }

        await db.insert(todoItemsTable).values({
          ...newTodoItemData,
          description,
          tempDbId: tempId,
          createdAtTimestampMs:
            newTodoItemData.createdAtTimestampMs || Date.now(),
          priority: 0,
        } satisfies TodoItemRecord);

        try {
          // Update the order index in the project
          const [project] = await db
            .select({
              id: projectsTable.id,
              itemPositionsInTheProject:
                projectsTable.itemPositionsInTheProject,
            })
            .from(projectsTable)
            .where(
              and(
                eq(projectsTable.id, projectId),
                eq(projectsTable.tempDbId, tempId),
              ),
            );

          if (!project) {
            throw new Error(`Project not found: ${projectId}`);
          }

          project.itemPositionsInTheProject[newTodoItemData.boardId] =
            project.itemPositionsInTheProject[newTodoItemData.boardId] || [];
          project.itemPositionsInTheProject[newTodoItemData.boardId].unshift(
            newTodoItemData.id,
          );

          await db
            .update(projectsTable)
            .set({
              itemPositionsInTheProject: project.itemPositionsInTheProject,
            })
            .where(
              and(
                eq(projectsTable.id, project.id),
                eq(projectsTable.tempDbId, tempId),
              ),
            );
        } catch (e) {
          // roll back
          try {
            await db
              .delete(todoItemsTable)
              .where(
                and(
                  eq(todoItemsTable.id, newTodoItemData.id),
                  eq(todoItemsTable.tempDbId, tempId),
                ),
              );
          } catch (deleteError) {
            console.error(
              "Error rolling back todo item after project update failure:",
              deleteError,
            );
            return new Response("Todo item insert rollback failed", {
              status: 500,
            });
          }

          console.error("Database error:", e);
          return new Response("Could not insert todo item", { status: 500 });
        }

        return json(
          { created: "ok" },
          {
            status: 201,
          },
        );
      },
      PATCH: async ({ context: { tempId }, request }) => {
        let updatedData: z.infer<typeof todoItemUpdateData>;

        // biome-ignore lint/suspicious/noExplicitAny: it can be any here
        let bodyObj: any;

        try {
          bodyObj = await request.json();
        } catch (e) {
          console.error("Error parsing JSON body:", e);
          return new Response(`Invalid JSON body`, { status: 400 });
        }

        try {
          updatedData = todoItemUpdateData.parse(bodyObj);
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

        const results = await db
          .update(todoItemsTable)
          .set(updatedData)
          .where(
            and(
              eq(todoItemsTable.id, updatedData.id),
              eq(todoItemsTable.tempDbId, tempId),
            ),
          );

        return json(results);
      },
    },
  },
});
