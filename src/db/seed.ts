// Generate a seed script
import { nanoid } from "nanoid";
import z from "zod";
// import { env } from "cloudflare:workers";
import { db } from ".";
import {
  type BoardRecord,
  boardsTable,
  type ProjectRecord,
  projectsTable,
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
    {
      id: nanoid(),
      name: "John Doe",
      age: 25,
      email: "john@doe.com",
      tempDbId,
    },
  ];

  const now = Date.now();

  const mockProjects: ProjectRecord[] = [
    {
      id: nanoid(),
      name: "Project Alpha",
      description: "First project description",
      createdAtTimestampMs: now,
      tempDbId,
    },
    {
      id: nanoid(),
      name: "Project Beta",
      description: "Second project description",
      createdAtTimestampMs: now,
      tempDbId,
    },
    {
      id: nanoid(),
      name: "Project Gamma",
      description: "Third project description",
      createdAtTimestampMs: now,
      tempDbId,
    },
  ];

  const { mockBoards, mockTodoItems } = mockProjects
    .map(({ id: projectId }) => {
      const boardIds = {
        todo: nanoid(),
        inProgress: nanoid(),
        done: nanoid(),
      };

      const boards: BoardRecord[] = [
        {
          id: boardIds.todo,
          projectId,
          name: "Todo",
          description: "Tasks to do",
          createdAtTimestampMs: now,
          tempDbId,
        },
        {
          id: boardIds.inProgress,
          projectId,
          name: "In Progress",
          description: "Tasks in progress",
          createdAtTimestampMs: now,
          tempDbId,
        },
        {
          id: boardIds.done,
          projectId,
          name: "Done",
          description: "Completed tasks",
          createdAtTimestampMs: now,
          tempDbId,
        },
      ];
      const todoItems: TodoItemRecord[] = [
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
        boards,
        todoItems,
      };
    })
    .reduce(
      (acc, { boards, todoItems }) => {
        acc.mockBoards.push(...boards);
        acc.mockTodoItems.push(...todoItems);
        return acc;
      },
      {
        mockBoards: [] as BoardRecord[],
        mockTodoItems: [] as TodoItemRecord[],
      },
    );

  return {
    mockUsers,
    mockBoards,
    mockTodoItems,
    mockProjects,
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
  const { mockUsers, mockBoards, mockTodoItems, mockProjects } =
    getMockData(tempDBId);

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

  z.array(
    z
      .object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        createdAtTimestampMs: z.number().min(1),
        boardId: z.string().min(1),
        tempDbId: z.string().min(1),
      })
      .strict(),
  ).parse(mockTodoItems);

  try {
    await db.insert(usersTable).values(mockUsers);
    await db.insert(projectsTable).values(mockProjects);
    await db.insert(boardsTable).values(mockBoards);

    // Batch insert to avoid "D1_ERROR: too many SQL variables at offset 448: SQLITE_ERROR" errors
    const BATCH_SIZE = 10; // adjust as needed

    for (let i = 0; i < mockTodoItems.length; i += BATCH_SIZE) {
      const batch = mockTodoItems.slice(i, i + BATCH_SIZE);
      await db.insert(todoItemsTable).values(batch);
    }
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
