import { Skeleton } from "./ui/skeleton";

function TaskSkeleton() {
  return <Skeleton className="h-[180px] mb-2 rounded-lg" />;
}

function BoardSkeleton({ taskCount }: { taskCount: number }) {
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
      <div className="relative flex-1 min-h-0 overflow-auto">
        {Array.from({ length: taskCount }).map((_, index) => (
          <TaskSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function TodoBoardsLoading() {
  return (
    <div className="flex-1 min-h-0">
      <div className="grid grid-cols-3 gap-4 h-full min-h-0">
        <BoardSkeleton taskCount={2} />
        <BoardSkeleton taskCount={3} />
        <BoardSkeleton taskCount={2} />
      </div>
    </div>
  );
}
