import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todosTable = sqliteTable("todos", {
  id: integer("id", { mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export type TodoRecord = typeof todosTable.$inferSelect;
