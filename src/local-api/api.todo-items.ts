import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { type TodoItemRecord, todoItemsTable } from "@/db/schema";
import { type APIRouteHandler, json } from "./helpers";

const todoItemCreateData = z.object({
  id: z.string().min(1),
  boardId: z.string(),
  priority: z.number().min(0).max(3).int().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  position: z.string(),
});

export type TodoItemCreateDataType = z.infer<typeof todoItemCreateData>;

const todoItemUpdateData = z.object({
  id: z.string(),
  boardId: z.string().optional(),
  priority: z.number().nullable().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  position: z.string().optional(),
});

export default {
  GET: async () => {
    const results = await db.select().from(todoItemsTable);

    return json(results);
  },
  POST: async ({ request }) => {
    // Create new todo item
    let newTodoItemData: Omit<z.infer<typeof todoItemCreateData>, "projectId">;
    // biome-ignore lint/suspicious/noExplicitAny: it can be any here
    let bodyObj: any;

    try {
      bodyObj = await request.json();
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return new Response(`Invalid JSON body`, { status: 400 });
    }

    try {
      const todoItemData = todoItemCreateData.parse(bodyObj);
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
      createdAt: new Date(),
      priority: 0,
    } satisfies TodoItemRecord);

    return json(
      { created: "ok" },
      {
        status: 201,
      },
    );
  },
  PATCH: async ({ request }) => {
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
      Object.keys(updatedData).length === 1 // there aren't keys other than id
    ) {
      return new Response(`No columns to update`, { status: 400 });
    }

    const results = await db
      .update(todoItemsTable)
      .set(updatedData)
      .where(eq(todoItemsTable.id, updatedData.id));

    return json(results);
  },
} satisfies APIRouteHandler;
