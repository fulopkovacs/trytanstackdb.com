import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

/**
  Stores the creation timestamp in milliseconds since epoch.
*/
const createdAtTimestampMs = int("created_at_timestamp_ms").default(
  sql`(strftime('%s','now') * 1000)`,
);

const tempDbId = text("temp_db_id")
  .references(() => tempDbsTable.id, {
    onDelete: "cascade",
  })
  .notNull();

export const usersTable = sqliteTable(
  "users",
  {
    id: text().primaryKey().notNull(), // nanoid
    name: text().notNull(),
    age: int().notNull(),
    email: text().notNull(),
    tempDbId,
  },
  (users) => [
    index("users_tenant_id_idx").on(users.tempDbId),
    unique("users_email_unique_tempdbid").on(users.email, users.tempDbId),
    // tenantEmailUnique: index("users_tenant_email_unique")
    //   .on(users.tempDbId, users.email)
    //   .unique(),
  ],
);

export type UserRecord = typeof usersTable.$inferSelect;

export const projectsTable = sqliteTable(
  "projects",
  {
    id: text().primaryKey(), // nanoid
    name: text().notNull(),
    description: text().notNull(),
    createdAtTimestampMs,
    tempDbId,
    itemPositionsInTheProject: text("item_positions_in_the_project", {
      mode: "json",
    })
      .$type<Record<string, string[]>>()
      .notNull()
      .default({}),
  },
  (projects) => [
    index("projects_tenant_id_idx").on(projects.tempDbId),
    unique("projects_name_unique_tempdbid").on(
      projects.name,
      projects.tempDbId,
    ),
  ],
);

export type ProjectRecord = typeof projectsTable.$inferSelect;

export const boardsTable = sqliteTable(
  "boards",
  {
    id: text().primaryKey(), // nanoid
    name: text().notNull(),
    description: text(),
    createdAtTimestampMs,
    projectId: text("project_id")
      .references(() => projectsTable.id, { onDelete: "cascade" })
      .notNull(),
    tempDbId,
  },
  (boards) => [index("boards_tenant_id_idx").on(boards.tempDbId)],
);

export type BoardRecord = typeof boardsTable.$inferSelect;

export const todoItemsTable = sqliteTable(
  "todo_items",
  {
    id: text().primaryKey(), // nanoid
    title: text().notNull(),
    description: text(),
    createdAtTimestampMs,
    boardId: text("board_id")
      .references(() => boardsTable.id, { onDelete: "cascade" })
      .notNull(),
    tempDbId,
  },
  (todoItems) => [
    index("todo_items_tenant_id_idx").on(todoItems.tempDbId),
    // TODO: maybe this could be needed
    // boardIdIdx: index("todo_items_board_id_idx").on(todoItems.boardId),
  ],
);

export type TodoItemRecord = typeof todoItemsTable.$inferSelect;

export const tempDbsTable = sqliteTable("temp_dbs", {
  id: text().primaryKey(), // nanoid
  createdAtTimestampMs,
  expiryTimestampMs: int("expiry_timestamp_ms").notNull(),
});
