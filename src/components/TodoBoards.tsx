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
import {
  CircleCheckBigIcon,
  LayoutListIcon,
  LoaderIcon,
  PlusIcon,
  SquarePenIcon,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { VList } from "virtua";
import { boardCollection } from "@/collections/boards";
import { projectsCollection } from "@/collections/projects";
import {
  batchUpdateTodoItem,
  todoItemsCollection,
} from "@/collections/todoItems";
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

enum BoardName {
  Todo = "Todo",
  InProgress = "In Progress",
  Done = "Done",
}

function DropIndicator() {
  return <div className="h-0.5 bg-primary mx-2 mb-[0.4375rem] rounded-full" />;
}

function ScrollShadow({
  position,
  visible,
}: {
  position: "top" | "bottom";
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-10 pointer-events-none z-10 transition-opacity duration-300 ease-in-out",
        position === "top"
          ? "top-0 bg-linear-to-b from-background to-transparent"
          : "bottom-0 bg-linear-to-t from-background to-transparent",
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

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
                console.log(e.key);
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
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="bg-skeleton rounded-lg mb-2 h-[180px] animate-skeleton-pulse"
      />
    );
  }

  return (
    <TaskBase
      task={task}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab"
    />
  );
}

function Board({ board }: { board: BoardRecord }) {
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
  const { scrollRef, canScrollUp, canScrollDown } = useScrollShadow();
  const containerRef = useRef<HTMLDivElement>(null);

  // Find and attach to VList's scroll container
  useEffect(() => {
    if (!containerRef.current) return;

    const findScrollElement = () => {
      // VList creates a scrollable div - find it by looking for overflow style
      const scrollableEl = containerRef.current?.querySelector(
        'div[style*="overflow"]',
      ) as HTMLDivElement;
      if (scrollableEl && scrollableEl !== scrollRef.current) {
        scrollRef.current = scrollableEl;
      }
    };

    // Try immediately
    findScrollElement();

    // Also observe for changes in case VList renders after this effect
    const observer = new MutationObserver(findScrollElement);
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [scrollRef]);

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
        <CreateOrEditTodoItems todoItem={{ boardId: board.id }}>
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
            containerRef.current = node;
          }}
          className="h-full"
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
                    {showDropIndicator && <DropIndicator />}
                    <DraggableTask task={todoItem} />
                  </div>
                );
              })}
              {active && dropIndex === todoItems.length && <DropIndicator />}
            </VList>
          </SortableContext>
        </div>

        <ScrollShadow position="bottom" visible={canScrollDown} />
      </div>
    </div>
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
    strategy: debounceStrategy({ wait: 3000 }),
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
        {isLoadingBoards ? (
          <TodoBoardsLoading />
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full min-h-0">
            {sortedBoards.map((board) => (
              <Board board={board} key={board.id} />
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
