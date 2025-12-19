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
import {
  debounceStrategy,
  eq,
  useLiveQuery,
  usePacedMutations,
} from "@tanstack/react-db";
import { generateKeyBetween } from "fractional-indexing";
import { PlusIcon } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";
import { VList } from "virtua";
import { boardCollection } from "@/collections/boards";
import { projectsCollection } from "@/collections/projects";
import {
  batchUpdateTodoItem,
  todoItemsCollection,
} from "@/collections/todoItems";
import type { BoardRecord, TodoItemRecord } from "@/db/schema";
import { cn } from "@/lib/utils";
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

function findPrevItem<
  T extends { boardId: string; todoItemId: string },
  U extends T,
>({
  todoItems,
  target,
}: {
  /**
    The todo items must be sorted by position ascending
  */
  todoItems: U[];
  target: T;
}) {
  const targetIndex = todoItems.findIndex(
    (t) => t.todoItemId === target.todoItemId,
  );

  const prev = todoItems[targetIndex - 1];

  return prev?.boardId === target.boardId ? prev : null;
}

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
        <CreateOrEditTodoItems todoItem={task}>
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
  projectId,
}: {
  board: BoardRecord;
  projectId: string;
}) {
  const { data: todoItems } = useLiveQuery((q) =>
    q
      .from({ todoItem: todoItemsCollection })
      .where(({ todoItem }) => eq(todoItem.boardId, board.id))
      .orderBy(({ todoItem }) => todoItem.position, {
        direction: "asc",
        /*
          We use fractional indexes, so we need lexical sorting to get the correct order.

          Ascending order of ["Zz",  "a0"] is:
          - lexical string sort: ["Zz",  "a0"]
          - default result (uses "locale"): ["a0", "Zz"]
        */
        stringSort: "lexical",
      }),
  );

  const { active, over } = useDndContext();

  const dropIndex = useMemo(() => {
    // Calculate drop index for indicator
    let dropIndex = -1;
    if (active && over && active.id !== over.id) {
      const overTaskIndex = todoItems.findIndex((item) => item.id === over.id);
      if (overTaskIndex !== -1) {
        // Show indicator before the over item
        const activeTaskIndex = todoItems.findIndex(
          (item) => item.id === active.id,
        );
        // Only hide the indicator if the active item is in this column and would be in the same position
        if (activeTaskIndex === -1 || activeTaskIndex !== overTaskIndex - 1) {
          dropIndex = overTaskIndex;
        }
      } else if (over.id === board.id) {
        // Dropping on this column (empty or at the end)
        const activeTaskIndex = todoItems.findIndex(
          (item) => item.id === active.id,
        );
        // Only hide the indicator if the active item is in this column and would be at the end
        if (
          activeTaskIndex === -1 ||
          activeTaskIndex !== todoItems.length - 1
        ) {
          dropIndex = todoItems.length;
        }
      }
    }

    return dropIndex;
  }, [todoItems, active, over, board.id]);

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
        <CreateOrEditTodoItems todoItem={{ boardId: board.id }}>
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
          items={todoItems.map((task) => task.id)}
        >
          <VList>
            {todoItems.map((todoItem, index) => {
              const showDropIndicator = active && dropIndex === index;
              return (
                <div key={`${todoItem.id}-wrapper`}>
                  {showDropIndicator && (
                    <div className="h-0.5 bg-blue-500 mx-2 my-1 rounded-full" />
                  )}
                  <DraggableTask projectId={projectId} task={todoItem} />
                </div>
              );
            })}
            {active && dropIndex === todoItems.length && (
              <div className="h-0.5 bg-blue-500 mx-2 my-1 rounded-full" />
            )}
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Create paced mutation with 3 second debounce for updating todo positions
  const updateTodoPosition = usePacedMutations<
    {
      itemId: string;
      boardId?: string;
      newPosition: string;
    },
    TodoItemRecord
  >({
    onMutate: ({ itemId, boardId, newPosition }) => {
      // Apply optimistic update immediately
      todoItemsCollection.update(itemId, (item) => {
        if (boardId) {
          item.boardId = boardId;
        }
        item.position = newPosition;
      });
    },
    mutationFn: async ({ transaction }) => {
      // Persist all position updates to the backend after debounce
      const mutations = transaction.mutations;

      const updates = mutations.reduce(
        (acc, mutation) => {
          const { modified, changes } = mutation;
          acc.push({
            id: modified.id,
            ...changes,
          });
          return acc;
        },
        [] as (Partial<TodoItemRecord> & { id: string })[],
      );

      await batchUpdateTodoItem({
        data: updates,
      });

      // Refetch to ensure consistency with backend
      await todoItemsCollection.utils.refetch();
    },
    strategy: debounceStrategy({ wait: 1_500 }),
  });

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

  const { data: orderedTodoItems } = useLiveQuery(
    (q) =>
      q
        .from({
          todoItem: todoItemsCollection,
        })
        .innerJoin({ board: boardCollection }, ({ todoItem, board }) =>
          eq(todoItem.boardId, board.id),
        )
        .innerJoin({ project: projectsCollection }, ({ board, project }) =>
          eq(board.projectId, project.id),
        )
        .where(({ project }) => eq(project.id, projectId))
        .select(({ todoItem, board }) => ({
          boardId: todoItem.boardId,
          boardName: board.name,
          todoTitle: todoItem.title,
          projectId: projectId,
          position: todoItem.position,
          todoItemId: todoItem.id,
        }))
        .orderBy(({ todoItem }) => [todoItem.boardId, todoItem.position], {
          direction: "asc",
          /*
            We use fractional indexes, so we need lexical sorting to get the correct order.

            Ascending order of ["Zz",  "a0"] is:
            - lexical string sort: ["Zz",  "a0"]
            - default result (uses "locale"): ["a0", "Zz"]
          */
          stringSort: "lexical",
        }),
    [projectId],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Find which column the dragged task is in

    if (boards.some((board) => board.id === over.id)) {
      // This is either an empty column or the last place of a column
      const newBoardId = over.id;
      const lastPositionInNewColumn = orderedTodoItems.findLast(
        (t) => t.boardId === newBoardId,
      )?.position;

      const newPosition = lastPositionInNewColumn
        ? generateKeyBetween(lastPositionInNewColumn, null)
        : generateKeyBetween(null, null);

      updateTodoPosition({
        itemId: active.id as string,
        boardId: newBoardId as string,
        newPosition,
      });
    } else {
      const overTodoItem = todoItemsCollection.toArray.find(
        (item) => item.id === over.id,
      );

      if (overTodoItem?.boardId === activeTodoItem.boardId) {
        // Reorder within the same column

        const prev = findPrevItem({
          todoItems: orderedTodoItems,
          target: {
            boardId: overTodoItem.boardId,
            todoItemId: overTodoItem.id as string,
          },
        });

        // Generate position between the item before 'over' and 'over' itself
        const newPosition = generateKeyBetween(
          prev?.position ?? null,
          overTodoItem.position,
        );

        updateTodoPosition({
          itemId: active.id as string,
          newPosition,
        });
      } else if (overTodoItem) {
        // Move to another column and insert at the correct position
        const newBoardId = overTodoItem.boardId;

        const prev = findPrevItem({
          todoItems: orderedTodoItems,
          target: {
            boardId: overTodoItem.boardId,
            todoItemId: overTodoItem.id as string,
          },
        });

        // Generate position between the item before 'over' and 'over' itself
        const newPosition = generateKeyBetween(
          prev?.position ?? null,
          overTodoItem.position,
        );

        updateTodoPosition({
          itemId: active.id as string,
          boardId: newBoardId as string,
          newPosition,
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
            <Board projectId={projectId} board={board} key={board.id} />
          ))}
        </div>
        <DragOverlay>
          {activeTodoItem ? <TaskBase task={activeTodoItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
