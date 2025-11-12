import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { todoItemsTable } from "@/db/schema";

const getTodos = createServerFn().handler(async () => {
  const todos = await db.select().from(todoItemsTable);
  // const todos: string[] = [];

  return todos;
});

const addTodo = createServerFn().handler(async () => {
  // const todo: Omit<TodoItemRecord, "id"> = {
  //   title: `New Todo - ${Date.now}`,
  //   createdAt: new Date(),
  // };

  // const insertedRecord = await db.insert(todosTable).values(todo).returning();

  // return insertedRecord;
  return null;
});

export const Route = createFileRoute("/")({ component: App });

function App() {
  const getTodosFn = useServerFn(getTodos);

  const getTodosQ = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const todos = await getTodosFn();
      return todos;
    },
  });

  const queryClient = useQueryClient();

  const addTodoFn = useServerFn(addTodo);

  const addTodoM = useMutation({
    mutationKey: ["add-todo"],
    mutationFn: async () => {
      const newTodo = await addTodoFn();
      return newTodo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      // getTodosQ.refetch();
      // invalidate the getTodos query
    },
  });

  return (
    <div className="">
      <h1>hello</h1>
      <button
        type="button"
        className="cursor-pointer text-blue-400"
        onClick={() => addTodoM.mutate()}
      >
        Add todo
      </button>
      <div className="bg-neutral-200">
        <h2>Todos</h2>
        <pre>{JSON.stringify(getTodosQ.data, null, 2)}</pre>
      </div>
    </div>
  );
}
