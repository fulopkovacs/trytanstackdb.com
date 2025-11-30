import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier,
  useDndContext,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { PlusIcon } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";
import { VList } from "virtua";
import { boardCollection } from "@/collections/boards";
import { projectsCollection } from "@/collections/projects";
import { todoItemsCollection } from "@/collections/todoItems";
import type { BoardRecord, TodoItemRecord } from "@/db/schema";
import { cn } from "@/lib/utils";
import { moveTask } from "@/utils/moveTask";
import { CreateOrEditTodoItems } from "./CreateOrEditTodoItems";
import { PriorityRatingPopup } from "./PriorityRating";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const COLUMN_COLORS = {
  Todo: "#FFB300",
  "In Progress": "#1976D2",
  Done: "#43A047",
};

function handlePriorityPointerDown(e: React.PointerEvent) {
  e.stopPropagation();
  e.preventDefault();
}

const TaskBase = forwardRef<
  HTMLDivElement,
  {
    task: TodoItemRecord;
    projectId?: string;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ task, projectId, className, ...props }, ref) => {
  // Prevent drag when clicking on PriorityRatingPopup

  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "select-none p-2 mb-2 bg-background rounded shadow-sm flex flex-col gap-2",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>{task.title}</div>
        <div
          onPointerDown={handlePriorityPointerDown}
          style={{ cursor: "pointer" }}
        >
          <PriorityRatingPopup priority={task.priority} todoItemId={task.id} />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{task.description}</div>
      {projectId ? (
        <CreateOrEditTodoItems todoItem={task} projectId={projectId}>
          <Button
            onPointerDown={handlePriorityPointerDown}
            onKeyDownCapture={(e) => {
              console.log(e.key);
              e.stopPropagation();
              e.preventDefault();
            }}
            style={{ cursor: "pointer" }}
            variant="ghost"
            size="sm"
            className="self-end text-muted-foreground hover:text-foreground"
          >
            Edit
          </Button>
        </CreateOrEditTodoItems>
      ) : (
        <Button
          disabled
          variant="ghost"
          size="sm"
          className="self-end text-muted-foreground"
        >
          Edit
        </Button>
      )}
    </div>
  );
});

function DraggableTask({
  task,
  projectId,
}: {
  task: TodoItemRecord;
  projectId: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <TaskBase
      projectId={projectId}
      task={task}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab", isDragging && "opacity-50")}
    />
  );
}

function Board({
  board,
  orderedIds,
  projectId,
}: {
  board: BoardRecord;
  orderedIds: string[];
  projectId: string;
}) {
  const { data: todoItems } = useLiveQuery((q) =>
    q
      .from({ todoItem: todoItemsCollection })
      .where(({ todoItem }) => eq(todoItem.boardId, board.id)),
  );

  const { active } = useDndContext();

  const { orderedTodoItems } = useMemo(() => {
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => {
      orderMap.set(id, idx);
    });

    const activeTaskIndex = orderMap.get(active?.id as string) || -1;

    const orderedTodoItems = todoItems.sort((a, b) => {
      // If id not found, put it at the end
      const practicallyInfinite = 10_0000; // realistically we won't have this many items in this array

      // const idxA1 = orderMap.get(a.id);
      // if (idxA1 === undefined) throw new Error("idxA1 is undefined");
      // const idxB1 = orderMap.get(b.id);
      // if (idxB1 === undefined) throw new Error("idxB1 is undefined");

      const idxA = orderMap.get(a.id) ?? practicallyInfinite;
      const idxB = orderMap.get(b.id) ?? practicallyInfinite;
      return idxA - idxB;
    });

    return { orderedTodoItems, activeTaskIndex };
  }, [todoItems, orderedIds, active]);

  const { setNodeRef } = useDroppable({ id: board.id });

  const color =
    COLUMN_COLORS[board.name as keyof typeof COLUMN_COLORS] || "#999999";

  return (
    <Card className="bg-sidebar flex flex-col flex-1 min-h-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div
            data-color={color}
            style={{ backgroundColor: color }}
            className={cn("h-2 w-2 rounded-full")}
          />
          <div>
            {board.name} ({todoItems.length} tasks)
          </div>
        </CardTitle>
        <CardDescription className="min-h-10">
          {board.description}
        </CardDescription>
        <CreateOrEditTodoItems
          todoItem={{ boardId: board.id }}
          projectId={board.projectId}
        >
          <Button variant={"secondary"}>
            <PlusIcon /> Add Task
          </Button>
        </CreateOrEditTodoItems>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="overflow-y-auto flex-1"
        style={{
          // TODO: Sometimes the height of the column is jumping
          // background: isOver ? "#e0f7fa" : undefined,
          transition: "background 0.2s",
        }}
      >
        <SortableContext
          strategy={verticalListSortingStrategy}
          items={orderedTodoItems.map((task) => task.id)}
        >
          <VList>
            {orderedTodoItems.map((todoItem) => {
              return (
                <div key={`${todoItem.id}-wrapper`}>
                  <DraggableTask projectId={projectId} task={todoItem} />
                </div>
              );
            })}
          </VList>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function LoadingTodoBoards() {
  return (
    <>
      <Card className="bg-sidebar flex flex-col flex-1 min-h-0" />
      <Card className="bg-sidebar flex flex-col flex-1 min-h-0" />
      <Card className="bg-sidebar flex flex-col flex-1 min-h-0" />
    </>
  );
}

export function TodoBoards({ projectId }: { projectId: string }) {
  // const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // const [inProgresIdsOrdered, setInProgressIdsOrdered] =
  //   useState<string[]>(initialOrder);

  const { data: boards, isLoading: isLoadingBoards } = useLiveQuery(
    (q) =>
      q
        .from({ board: boardCollection })
        .where(({ board }) => eq(board.projectId, projectId)),
    [projectId],
  );

  const {
    data: [activeTodoItem],
  } = useLiveQuery(
    (q) =>
      q
        .from({ todoItem: todoItemsCollection })
        .where(({ todoItem }) => eq(todoItem.id, activeId)),
    [activeId, projectId],
  );

  const {
    data: [project],
  } = useLiveQuery(
    (q) =>
      q
        .from({ project: projectsCollection })
        .where(({ project }) => eq(project.id, projectId)),
    [projectId],
  );

  // const [state, dispatch] = useReducer(reducer, boardsWithOrderedIndices);
  //
  // const {
  //   data: [overTodoItem],
  // } = useLiveQuery(
  //   (q) =>
  //     q
  //       .from({ todoItem: todoItemsCollection })
  //       .where(({ todoItem }) => eq(todoItem.id, overId)),
  //   [overId],
  // );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  // TODO: this should be an optimisticAction
  // that updates both todoItems and projects collections.
  // That would give us proper rollbacks on errors.
  function updatePositionsInProject(
    updatedPositions: Record<string, string[]>,
  ) {
    const oldPositions = project.itemPositionsInTheProject;

    projectsCollection.update(project.id, (item) => {
      item.itemPositionsInTheProject = {
        ...oldPositions,
        ...updatedPositions,
      };
    });
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // TODO: Fix this mess lol, I didn't have time T-T
    // BUG: when you drag a task to the first position of another
    // not-empty column, you don't see the placeholder
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    const state = project.itemPositionsInTheProject;

    // Find which column the dragged task is in

    if (boards.some((board) => board.id === over.id)) {
      // This is either an empty column or the last place of a column
      const newBoardId = over.id;
      const oldBoardId = activeTodoItem.boardId;

      todoItemsCollection.update(active.id, (item) => {
        item.boardId = newBoardId as string;
      });

      // Update the ordered indices in the state
      const oldColumnIds = state[activeTodoItem.boardId] || [];
      const newColumnIds = state[newBoardId] || [];

      updatePositionsInProject({
        [oldBoardId]: oldColumnIds.filter((id) => id !== active.id),
        [newBoardId]: [...newColumnIds, active.id as string],
      });
    } else {
      const overTodoItem = todoItemsCollection.toArray.find(
        (item) => item.id === over.id,
      );

      if (overTodoItem?.boardId === activeTodoItem.boardId) {
        // Reorder within the same column
        const orderedColumnIds = state[activeTodoItem.boardId] || [];
        const oldIndex = orderedColumnIds.indexOf(active.id as string);
        const newIndex = orderedColumnIds.indexOf(over.id as string);
        // Reorder the tasks in the column
        // All indices below the new position got decreased by 1
        const newColumnTasks = moveTask(orderedColumnIds, oldIndex, newIndex);
        // console.log({ oldIndex, newIndex });

        updatePositionsInProject({
          [activeTodoItem.boardId]: newColumnTasks,
        });
      } else if (overTodoItem) {
        // Move to another column and insert at the correct position
        const oldColumnIds = state[activeTodoItem.boardId] || [];
        const newColumnIds = state[overTodoItem.boardId] || [];

        const newIndex = newColumnIds.indexOf(over.id as string);

        const oldBoardId = activeTodoItem.boardId;
        const newBoardId = overTodoItem.boardId;

        todoItemsCollection.update(active.id, (item) => {
          item.boardId = newBoardId as string;
        });

        newColumnIds.splice(newIndex, 0, activeTodoItem.id);

        updatePositionsInProject({
          [oldBoardId]: oldColumnIds.filter((id) => id !== active.id),
          [newBoardId]: newColumnIds,
        });
      } else {
        console.error("overTodoId not found");
      }
    }
  };

  const sortedBoards = useMemo(
    () =>
      boards.sort((a) =>
        a.name === "Todo" ? -1 : a.name === "In Progress" ? -1 : 1,
      ),
    [boards],
  );

  return (
    <div className="flex-1 min-h-0">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-4 h-full min-h-0">
          {isLoadingBoards && <LoadingTodoBoards />}
          {sortedBoards.map((board) => (
            <Board
              projectId={projectId}
              board={board}
              key={board.id}
              orderedIds={project.itemPositionsInTheProject[board.id] || []}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTodoItem ? <TaskBase task={activeTodoItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
