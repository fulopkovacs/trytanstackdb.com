import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { TodoBoards } from "@/components/TodoBoards";
import { mockTasks } from "@/data/mockTasks";
import { getBoardsQueryOptions } from "@/server/functions/getBoards";

export const Route = createFileRoute("/projects/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();

  const { data: boards } = useSuspenseQuery(getBoardsQueryOptions);

  const boardName = useMemo(() => {
    return (
      boards.find((board) => board.id === projectId)?.name || "Unknown Board"
    );
  }, [boards, projectId]);

  const tasks = useMemo(() => {
    const limit = 1500;
    const tasks = [...mockTasks];

    for (let i = 0; i < limit; i++) {
      tasks.push({
        id: `task-${i + mockTasks.length + 1}`,
        title: `Task ${i + mockTasks.length + 1}`,
        // status: mockTasks[i % mockTasks.length].status,
        status: "todo",
      });
    }

    // return tasks.slice(0, 7);
    return tasks;
  }, []);

  return (
    <div className="px-4 py-2 flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
        {boardName}
      </h1>
      {/* <div className="flex-1 bg-blue-200 overflow-y-scroll scroll-pb-2 scroll-mb-2"> */}
      <TodoBoards tasks={tasks} />
    </div>
  );
}
