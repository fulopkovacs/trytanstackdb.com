import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { TodoBoards } from "@/components/TodoBoards";
import { mockTasks } from "@/data/mockTasks";
import { getBoardsQueryOptions } from "@/server/functions/getBoards";

export const Route = createFileRoute("/boards/$boardId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { boardId } = Route.useParams();

  const {
    data: { boards },
  } = useSuspenseQuery(getBoardsQueryOptions);

  const boardName = useMemo(() => {
    return (
      boards.find((board) => board.id === boardId)?.name || "Unknown Board"
    );
  }, [boards, boardId]);

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
        {boardName}
      </h1>
      <TodoBoards tasks={mockTasks} />
    </div>
  );
}
