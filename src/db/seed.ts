// Generate a seed script
import { nanoid } from "nanoid";

// import { env } from "cloudflare:workers";
import { db } from ".";
import {
  type BoardRecord,
  boardsTable,
  type TodoItemRecord,
  todoItemsTable,
  type UserRecord,
  usersTable,
} from "./schema";

function getMockData(tempDbId: string) {
  const mockUsers: UserRecord[] = [
    {
      id: nanoid(),
      name: "Alice Smith",
      age: 28,
      email: "alice@example.com",
      tempDbId,
    },
    {
      id: nanoid(),
      name: "Bob Johnson",
      age: 35,
      email: "bob@example.com",
      tempDbId,
    },
    {
      id: nanoid(),
      name: "Charlie Lee",
      age: 22,
      email: "charlie@example.com",
      tempDbId,
    },
  ];

  const now = Date.now();

  const boardIds = {
    todo: nanoid(),
    inProgress: nanoid(),
    done: nanoid(),
  };

  const mockBoards: BoardRecord[] = [
    {
      id: boardIds.todo,
      name: "Todo",
      description: "Tasks to do",
      createdAtTimestampMs: now,
      tempDbId,
    },
    {
      id: boardIds.inProgress,
      name: "In Progress",
      description: "Tasks in progress",
      createdAtTimestampMs: now,
      tempDbId,
    },
    {
      id: boardIds.done,
      name: "Done",
      description: "Completed tasks",
      createdAtTimestampMs: now,
      tempDbId,
    },
  ];

  const mockTodoItems: TodoItemRecord[] = [
    // Todo board
    {
      id: nanoid(),
      title: "Buy groceries",
      description: "Milk, eggs, bread",
      createdAtTimestampMs: now,
      boardId: boardIds.todo,
      tempDbId,
    },
    {
      id: nanoid(),
      title: "Read a book",
      description: "Finish reading 'Atomic Habits'",
      createdAtTimestampMs: now,
      boardId: boardIds.todo,
      tempDbId,
    },
    // In Progress board
    {
      id: nanoid(),
      title: "Write blog post",
      description: "Draft for tech blog",
      createdAtTimestampMs: now,
      boardId: boardIds.inProgress,
      tempDbId,
    },
    {
      id: nanoid(),
      title: "Workout",
      description: "30 min cardio",
      createdAtTimestampMs: now,
      boardId: boardIds.inProgress,
      tempDbId,
    },
    {
      id: nanoid(),
      title: "Update resume",
      description: "Add recent projects",
      createdAtTimestampMs: now,
      boardId: boardIds.inProgress,
      tempDbId,
    },
    // Done board
    {
      id: nanoid(),
      title: "Call mom",
      description: "Weekly check-in",
      createdAtTimestampMs: now,
      boardId: boardIds.done,
      tempDbId,
    },
    {
      id: nanoid(),
      title: "Clean desk",
      description: "Organize workspace",
      createdAtTimestampMs: now,
      boardId: boardIds.done,
      tempDbId,
    },
  ];

  return {
    mockUsers,
    mockBoards,
    mockTodoItems,
  };
}

async function dropAllTables() {
  // Get all user tables
  const tables: { name: string }[] = await db.all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('sqlite_sequence', 'd1_migrations', '_cf_METADATA');",
  );
  for (const { name } of tables) {
    await db.run(`DELETE FROM "${name}";`);
  }
  console.log("All tables have been cleaned up.");
}

export async function seed(tempDBId: string) {
  const { mockUsers, mockBoards, mockTodoItems } = getMockData(tempDBId);

  /*
    NOTE: transactions are not supported in D1 (https://github.com/drizzle-team/drizzle-orm/issues/2463)
    use batch API: https://github.com/drizzle-team/drizzle-orm/issues/2463#issuecomment-2155864439
    no support planned: https://github.com/cloudflare/workers-sdk/issues/2733#issuecomment-271236533
  */
  // await db.transaction(async (tx) => {
  //   await tx.insert(usersTable).values(mockUsers).onConflictDoNothing();
  //   await tx.insert(boardsTable).values(mockBoards).onConflictDoNothing();
  //   await tx.insert(todoItemsTable).values(mockTodoItems).onConflictDoNothing();
  // });
  try {
    await db.insert(usersTable).values(mockUsers);
    await db.insert(boardsTable).values(mockBoards);
    await db.insert(todoItemsTable).values(mockTodoItems);
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

export async function resetAndSeed() {
  await dropAllTables();
  await seed("default_temp_db");
  console.log("Database reset and seeded.");
}

// seed();
