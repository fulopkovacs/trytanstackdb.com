// Generate a seed script

import { nanoid } from "nanoid";
import { db } from ".";
import {
  type BoardRecord,
  boardsTable,
  type ProjectRecord,
  projectsTable,
  seedTable,
  type TodoItemRecord,
  todoItemsTable,
  type UserRecord,
  usersTable,
} from "./schema";

type BoardName = "Todo" | "In Progress" | "Done";
type TodoItemBase = Omit<
  TodoItemRecord,
  "id" | "boardId" | "tempDbId" | "createdAt"
> & { boardName: BoardName };

type ProjectBase = Omit<ProjectRecord, "itemPositionsInTheProject"> & {
  todoItemsBaseArr: TodoItemBase[];
};

const todoItemsList: TodoItemBase[] = [
  // Todo board
  {
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    boardName: "Todo",
    priority: 3,
  },
  {
    title: "Read a book",
    description: "Finish reading 'Atomic Habits'",
    boardName: "Todo",
    priority: 0,
  },
  // In Progress board
  {
    title: "Write blog post",
    description: "Draft for tech blog",
    boardName: "In Progress",
    priority: 2,
  },
  {
    title: "Workout",
    description: "30 min cardio",
    boardName: "In Progress",
    priority: 0,
  },
  {
    title: "Update resume",
    description: "Add recent projects",
    boardName: "In Progress",
    priority: 0,
  },
  // Done board
  {
    title: "Call mom",
    description: "Weekly check-in",
    boardName: "Done",
    priority: 0,
  },
  {
    title: "Clean desk",
    description: "Organize workspace",
    boardName: "Done",
    priority: 0,
  },
];

const largeTodoItemsList: TodoItemBase[] = Array.from({
  length: 1000,
}).map((_, index) => {
  const boardName = (["Todo", "In Progress", "Done"] satisfies BoardName[])[
    Math.floor(Math.random() * 10) % 3
  ];
  return {
    title: `Task ${index + 1}`,
    description: `Description for task ${index + 1}`,
    boardName,
    priority: 0,
  };
});

function getMockBoardsAndTodoItemsForProject({
  projectId,
  now,
  todoItemBaseArr,
}: {
  projectId: ProjectRecord["id"];
  now: Date;
  todoItemBaseArr: TodoItemBase[];
}): {
  mockBoards: BoardRecord[];
  mockTodoItems: TodoItemRecord[];
} {
  const boardIds: Record<BoardName, string> = {
    Todo: nanoid(),
    Done: nanoid(),
    "In Progress": nanoid(),
  };

  const boards: BoardRecord[] = [
    {
      id: boardIds.Todo,
      projectId,
      name: "Todo",
      description: "Tasks to do",
      createdAt: now,
    },
    {
      id: boardIds["In Progress"],
      projectId,
      name: "In Progress",
      description: "Tasks in progress",
      createdAt: now,
    },
    {
      id: boardIds.Done,
      projectId,
      name: "Done",
      description: "Completed tasks",
      createdAt: now,
    },
  ];

  const todoItems: TodoItemRecord[] = todoItemBaseArr.map(
    ({ boardName, ...item }) => ({
      ...item,
      id: nanoid(),
      boardId: boardIds[boardName],
      createdAt: now,
    }),
  );

  return { mockBoards: boards, mockTodoItems: todoItems };
}

function getMockData() {
  const mockUsers: UserRecord[] = [
    {
      id: nanoid(),
      name: "Alice Smith",
      age: 28,
      email: "alice@example.com",
    },
    {
      id: nanoid(),
      name: "Bob Johnson",
      age: 35,
      email: "bob@example.com",
    },
    {
      id: nanoid(),
      name: "Charlie Lee",
      age: 22,
      email: "charlie@example.com",
    },
    {
      id: nanoid(),
      name: "John Doe",
      age: 25,
      email: "john@doe.com",
    },
  ];

  const now = new Date();

  const mockProjects: ProjectBase[] = [
    {
      id: nanoid(),
      name: "Project Alpha",
      description: "First project description",
      createdAt: now,
      todoItemsBaseArr: todoItemsList,
    },
    {
      id: nanoid(),
      name: "Project Beta",
      description: "Second project description",
      createdAt: now,
      todoItemsBaseArr: todoItemsList,
    },
    {
      id: nanoid(),
      name: "Large Project",
      description: "Third project description",
      createdAt: now,
      todoItemsBaseArr: largeTodoItemsList,
    },
  ];

  const { boards: mockBoards, todoItems: mockTodoItems } = mockProjects
    .map((project) =>
      getMockBoardsAndTodoItemsForProject({
        projectId: project.id,
        now,
        todoItemBaseArr: project.todoItemsBaseArr,
      }),
    )
    .reduce(
      (acc, { mockBoards, mockTodoItems }) => {
        acc.boards.push(...mockBoards);
        acc.todoItems.push(...mockTodoItems);
        return acc;
      },
      { boards: [] as BoardRecord[], todoItems: [] as TodoItemRecord[] },
    );

  const projectsWithPositions: ProjectRecord[] = mockProjects.map((project) => {
    const projectBoards = mockBoards.filter(
      (board) => board.projectId === project.id,
    );
    const itemPositionsInTheProject: Record<string, string[]> = {};

    for (const board of projectBoards) {
      const itemsInBoard = mockTodoItems
        .filter((item) => item.boardId === board.id)
        .map((item) => item.id);
      itemPositionsInTheProject[board.id] = itemsInBoard;
    }

    return {
      ...project,
      itemPositionsInTheProject,
    };
  });

  return {
    mockUsers,
    mockBoards,
    mockTodoItems,
    mockProjects: projectsWithPositions,
  };
}

// TODO: make it possible to reset the tables
// async function cleanAllTables() {
//   // Get all user tables
//   const tables = await db.execute(
//     sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('sqlite_sequence', 'd1_migrations', '_cf_METADATA');`,
//   );
//
//   for (const { name } of tables) {
//     await db.execute(`DELETE FROM "${name}";`);
//   }
//   console.log("All tables have been cleaned up.");
// }

export async function seed() {
  // Make sure the seed script has not been executed before
  const [existingSeed] = await db.select().from(seedTable).limit(1);

  if (existingSeed) {
    const [firstProjectId] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .limit(1);
    return {
      firstProjectId: firstProjectId.id,
    };
  }

  const { mockUsers, mockBoards, mockTodoItems, mockProjects } = getMockData();

  /*
    NOTE: transactions are not supported in D1 (https://github.com/drizzle-team/drizzle-orm/issues/2463)
    use batch API: https://github.com/drizzle-team/drizzle-orm/issues/2463#issuecomment-2155864439
    no support planned: https://github.com/cloudflare/workers-sdk/issues/2733#issuecomment-271236533
  */
  try {
    await db.insert(seedTable).values({
      id: nanoid(),
      createdAt: new Date(),
      state: "in_progress",
    });
    await db.insert(usersTable).values(mockUsers);
    await db.insert(projectsTable).values(mockProjects);
    await db.insert(boardsTable).values(mockBoards);

    // Batch insert to avoid "D1_ERROR: too many SQL variables at offset 448: SQLITE_ERROR" errors
    const BATCH_SIZE = 10; // adjust as needed

    for (let i = 0; i < mockTodoItems.length; i += BATCH_SIZE) {
      const batch = mockTodoItems.slice(i, i + BATCH_SIZE);
      await db.insert(todoItemsTable).values(batch);
    }
    await db.insert(seedTable).values({
      id: nanoid(),
      createdAt: new Date(),
      state: "completed",
    });

    return {
      firstProjectId: mockProjects[0].id,
    };
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}
