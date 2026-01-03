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
import { generateKeyBetween } from "fractional-indexing";
import {
  CircleCheckBigIcon,
  LayoutListIcon,
  LoaderIcon,
  PlusIcon,
  SquarePenIcon,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Virtualizer } from "virtua";
import { boardCollection } from "@/collections/boards";
import { todoItemsCollection } from "@/collections/todoItems";
import type { BoardRecord, TodoItemRecord } from "@/db/schema";
import { useScrollShadow } from "@/hooks/use-scroll-shadow";
import { cn } from "@/lib/utils";
import { CreateOrEditTodoItems } from "./CreateOrEditTodoItems";
import { PriorityRatingPopup } from "./PriorityRating";
import { TodoBoardsLoading } from "./TodoBoardsLoading";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollShadow } from "./ui/scroll-shadow";

enum BoardName {
  Todo = "Todo",
  InProgress = "In Progress",
  Done = "Done",
}

const TASK_ITEM_HEIGHT = 180;

function DropIndicator() {
  return <div className="h-0.5 bg-primary mx-2 mb-[0.4375rem] rounded-full" />;
}

function findPrevItem<T extends { boardId: string; id: string }, U extends T>({
  todoItems,
  target,
}: {
  /**
    The todo items must be sorted by position ascending
  */
  todoItems: U[];
  target: T;
}) {
  const targetIndex = todoItems.findIndex((t) => t.id === target.id);

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
  } & React.HTMLAttributes<HTMLDivElement>
>(({ task, className, ...props }, ref) => {
  // Prevent drag when clicking on PriorityRatingPopup

  return (
    <Card
      {...props}
      ref={ref}
      className={cn("select-none mb-2 relative overflow-hidden", className)}
    >
      <div className="absolute top-0 left-0 w-full flex justify-center bg-muted select-none">
        {/* <GripHorizontalIcon className=" h-4" /> */}
        <div className="text-muted-foreground">≡</div>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between mt-2">
          <span className="block grow text-balance">{task.title}</span>
          <PriorityRatingPopup priority={task.priority} todoItemId={task.id} />
        </CardTitle>
        <CardDescription>{task.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        {
          <CreateOrEditTodoItems todoItem={task}>
            <Button
              onPointerDown={handlePriorityPointerDown}
              onKeyDownCapture={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <SquarePenIcon className="text-primary" /> Edit
            </Button>
          </CreateOrEditTodoItems>
        }
      </CardFooter>
    </Card>
  );
});

function DraggableTask({ task }: { task: TodoItemRecord }) {
  const taskRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  // Measure height after the element is rendered
  useEffect(
    () => {
      if (taskRef.current) {
        setMeasuredHeight(taskRef.current.offsetHeight);
      }
    },
    /*
      No dependency array: remeasures on every render
      to capture dynamic content changes (edits, etc.)
    */
  );

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ height: measuredHeight ?? TASK_ITEM_HEIGHT }}
        className="bg-skeleton rounded-lg mb-2 animate-skeleton-pulse"
      />
    );
  }

  return (
    <TaskBase
      task={task}
      ref={(node) => {
        setNodeRef(node);
        taskRef.current = node;
      }}
      {...attributes}
      {...listeners}
      className="cursor-grab"
    />
  );
}

function Board({
  board,
  todoItems,
  projectId,
}: {
  board: BoardRecord;
  todoItems: TodoItemRecord[];
  projectId: string;
}) {
  const { active, over } = useDndContext();
  const { scrollRef, canScrollUp, canScrollDown } = useScrollShadow();

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div>
            {board.name === BoardName.Done ? (
              <CircleCheckBigIcon />
            ) : board.name === BoardName.InProgress ? (
              <LoaderIcon />
            ) : (
              <LayoutListIcon />
            )}
          </div>
          <h2 className="text-lg font-semibold">{board.name}</h2>
          <Badge variant={"secondary"}>{todoItems.length} tasks</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {board.description}
        </p>
        <CreateOrEditTodoItems todoItem={{ boardId: board.id, projectId }}>
          <Button className="w-full" variant={"outline"}>
            <PlusIcon /> Add Task
          </Button>
        </CreateOrEditTodoItems>
      </div>
      <div className="relative flex-1 min-h-0">
        <ScrollShadow position="top" visible={canScrollUp} />

        <div
          ref={(node) => {
            setNodeRef(node);
            scrollRef.current = node;
          }}
          className="h-full overflow-auto"
        >
          <SortableContext
            strategy={verticalListSortingStrategy}
            items={todoItems.map((task) => task.id)}
          >
            {
              /*
                Empty columns do not have any todo items in them, so we can't
                render the drop indicator when we iterate through the todo items.

                In that case, we need to render the drop indicator here.
              */
              active && dropIndex === 0 && todoItems.length === 0 && (
                <DropIndicator />
              )
            }
            <Virtualizer data={todoItems}>
              {(todoItem, index) => {
                const showDropIndicator = active && dropIndex === index;
                return (
                  <div key={`${todoItem.id}-wrapper`}>
                    {showDropIndicator && <DropIndicator />}
                    <DraggableTask task={todoItem} />
                    {active &&
                      dropIndex === todoItems.length &&
                      index === todoItems.length - 1 && <DropIndicator />}
                  </div>
                );
              }}
            </Virtualizer>
          </SortableContext>
        </div>

        <ScrollShadow position="bottom" visible={canScrollDown} />
      </div>
    </div>
  );
}

export function TodoBoards({ projectId }: { projectId: string }) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const updateTodoPosition = ({
    itemId,
    boardId,
    newPosition,
  }: {
    itemId: string;
    boardId?: string;
    newPosition: string;
  }) => {
    todoItemsCollection.update(itemId, (item) => {
      if (boardId) {
        item.boardId = boardId;
      }
      item.position = newPosition;
    });
  };

  const { data: boards, isLoading: isLoadingBoards } = useLiveQuery(
    (q) =>
      q
        .from({ board: boardCollection })
        .where(({ board }) => eq(board.projectId, projectId)),
    [projectId],
  );

  // Fetch all todo items for the project in a single query
  const { data: allTodoItems } = useLiveQuery(
    (q) =>
      q
        .from({ todoItem: todoItemsCollection })
        .where(({ todoItem }) => eq(todoItem.projectId, projectId))
        .orderBy(({ todoItem }) => todoItem.position, {
          direction: "asc",
          stringSort: "lexical",
        }),
    [projectId],
  );

  // Get active todo item from already-loaded collection data
  // instead of making a separate query
  const activeTodoItem = activeId
    ? todoItemsCollection.toArray.find((item) => item.id === activeId)
    : undefined;

  // Derive ordered todo items from already-loaded collection data
  // instead of making a separate query
  const orderedTodoItems = useMemo(() => {
    const boardIdSet = new Set(boards.map((b) => b.id));
    return todoItemsCollection.toArray
      .filter((item) => boardIdSet.has(item.boardId))
      .sort((a, b) => {
        // Sort by boardId first, then by position (lexical for fractional indexing)
        if (a.boardId !== b.boardId) {
          return a.boardId.localeCompare(b.boardId);
        }
        return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
      });
  }, [boards]);

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

      if (!overTodoItem) {
        console.error("overTodoId not found");
        return;
      }

      if (overTodoItem.boardId === activeTodoItem?.boardId) {
        // Reorder within the same column

        const prev = findPrevItem({
          todoItems: orderedTodoItems,
          target: {
            boardId: overTodoItem.boardId,
            id: overTodoItem.id as string,
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
      } else {
        // Move to another column and insert at the correct position
        const newBoardId = overTodoItem.boardId;

        const prev = findPrevItem({
          todoItems: orderedTodoItems,
          target: {
            boardId: overTodoItem.boardId,
            id: overTodoItem.id as string,
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
        {isLoadingBoards ? (
          <TodoBoardsLoading />
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full min-h-0">
            {sortedBoards.map((board) => (
              <Board
                board={board}
                key={board.id}
                todoItems={allTodoItems.filter(
                  (item) => item.boardId === board.id,
                )}
                projectId={projectId}
              />
            ))}
          </div>
        )}
        <DragOverlay>
          {activeTodoItem ? (
            <TaskBase task={activeTodoItem} className="animate-wiggle" />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
