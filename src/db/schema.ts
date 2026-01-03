import {
  date,
  index,
  integer,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";

/**
  Stores the creation timestamp in milliseconds since epoch.
*/
const createdAt = date("created_at", { mode: "date" }).notNull();

export const usersTable = pgTable(
  "users",
  {
    id: text().primaryKey().notNull(), // nanoid
    name: text().notNull(),
    age: integer().notNull(),
    email: text().notNull(),
  },
  (users) => [
    unique("users_email_unique_tempdbid").on(users.email),
    // tenantEmailUnique: index("users_tenant_email_unique")
    //   .on(users.tempDbId, users.email)
    //   .unique(),
  ],
);

export type UserRecord = typeof usersTable.$inferSelect;

export const projectsTable = pgTable("projects", {
  id: text().primaryKey(), // nanoid
  name: text().notNull().unique(),
  description: text().notNull(),
  createdAt,
});

export type ProjectRecord = typeof projectsTable.$inferSelect;

export const boardsTable = pgTable("boards", {
  id: text().primaryKey(), // nanoid
  name: text().notNull(),
  description: text(),
  createdAt,
  projectId: text("project_id")
    .references(() => projectsTable.id, { onDelete: "cascade" })
    .notNull(),
});

export type BoardRecord = typeof boardsTable.$inferSelect;

export const todoItemsTable = pgTable(
  "todo_items",
  {
    id: text().primaryKey(), // nanoid
    title: text().notNull(),
    description: text(),
    createdAt,
    boardId: text("board_id")
      .references(() => boardsTable.id, { onDelete: "cascade" })
      .notNull(),
    projectId: text("project_id")
      .references(() => projectsTable.id, { onDelete: "cascade" })
      .notNull(),
    priority: integer().default(0),
    position: text().notNull(),
  },
  (table) => [
    index("todo_items_board_id_position_idx").on(table.boardId, table.position),
    index("todo_items_project_id_idx").on(table.projectId),
  ],
);

export type TodoItemRecord = typeof todoItemsTable.$inferSelect;

export const seedTable = pgTable("seed_script_runs", {
  id: text().primaryKey(), // nanoid
  createdAt,
  // state: pgEnum("state", ["completed", "in_progress", "failed"])(),
  // NOTE: pgEnum doesn't seem to work with pglite
  state: text("state"),
});
