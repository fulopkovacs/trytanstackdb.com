import { Skeleton } from "./ui/skeleton";

function TaskSkeleton() {
  return <Skeleton className="h-[180px] mb-2 rounded-lg" />;
}

export function LoadingTasksOnBoardSkeleton({
  boardIndex,
}: {
  boardIndex: number;
}) {
  return (
    <div className="relative flex-1 min-h-0 overflow-auto">
      {Array.from({ length: boardIndex === 1 ? 3 : 2 }).map((_, index) => (
        <TaskSkeleton key={index} />
      ))}
    </div>
  );
}

function BoardSkeleton({ boardIndex }: { boardIndex: number }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <LoadingTasksOnBoardSkeleton boardIndex={boardIndex} />
    </div>
  );
}

export function TodoBoardsLoading() {
  return (
    <div className="flex-1 min-h-0">
      <div className="grid grid-cols-3 gap-4 h-full min-h-0">
        <BoardSkeleton boardIndex={0} />
        <BoardSkeleton boardIndex={1} />
        <BoardSkeleton boardIndex={2} />
      </div>
    </div>
  );
}
