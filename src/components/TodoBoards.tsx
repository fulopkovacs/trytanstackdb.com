import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { forwardRef, useMemo, useState } from "react";
import { VList } from "virtua";
import { boardCollection } from "@/collections/boards";
import { todoItemsCollection } from "@/collections/todoItems";
import type { BoardRecord, TodoItemRecord } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const COLUMN_COLORS = {
  todo: "#FFB300",
  "in-progress": "#1976D2",
  done: "#43A047",
};

const TaskBase = forwardRef<
  HTMLDivElement,
  { task: TodoItemRecord } & React.HTMLAttributes<HTMLDivElement>
>(({ task, className, ...props }, ref) => {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "select-none p-2 mb-2 bg-background rounded shadow-sm",
        className,
      )}
    >
      {task.title}
    </div>
  );
});

function DraggableTask({ task }: { task: TodoItemRecord }) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <TaskBase
      task={task}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab", isDragging && "opacity-50")}
    />
  );
}

function DraggedTaskSlot({ activeTask }: { activeTask: TodoItemRecord }) {
  return (
    <TaskBase task={activeTask} className="bg-cyan-100 dark:bg-cyan-950/80" />
  );
}

function Board({
  board,
  activeId,
  activeTask,
  overId,
}: {
  board: BoardRecord;
  activeId: UniqueIdentifier | null;
  activeTask: TodoItemRecord | null;
  overId: UniqueIdentifier | null;
}) {
  const { data: todoItems } = useLiveQuery((q) =>
    q
      .from({ todoItem: todoItemsCollection })
      .where(({ todoItem }) => eq(todoItem.boardId, board.id)),
  );

  // There should be a better way to get this
  const activeTaskIndex = useMemo(
    () => todoItems.findIndex((t) => t.id === activeId),
    [todoItems, activeId],
  );

  const { setNodeRef, isOver } = useDroppable({ id: board.id });

  const color =
    COLUMN_COLORS[board.id as keyof typeof COLUMN_COLORS] || "#999999";

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
            {todoItems.map((todoItem, i) => {
              const showDropIndicator =
                activeId &&
                overId === todoItem.id &&
                activeId !== todoItem.id &&
                // We don't want the drop indicator to be shown
                // right below the active task
                activeTaskIndex + 1 !== i;

              return (
                <div key={`${todoItem.id}-wrapper`}>
                  {showDropIndicator && activeTask && (
                    <DraggedTaskSlot activeTask={activeTask} />
                  )}
                  <DraggableTask task={todoItem} />
                </div>
              );
            })}
            {/* If column is empty and is being dragged over, show drop indicator */}
            {isOver && activeTask && (
              <DraggedTaskSlot activeTask={activeTask} />
            )}
          </VList>
        </SortableContext>
        <div></div>
      </CardContent>
    </Card>
  );
}

export function TodoBoards({ projectId }: { projectId: string }) {
  // const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  const { data: boards } = useLiveQuery((q) =>
    q
      .from({ board: boardCollection })
      .where(({ board }) => eq(board.projectId, projectId)),
  );

  const {
    data: [activeTodoItem],
  } = useLiveQuery(
    (q) =>
      q
        .from({ todoItem: todoItemsCollection })
        .where(({ todoItem }) => eq(todoItem.id, activeId)),
    [activeId],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? event.over.id : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Find which column the dragged task is in
    // const activeBoard = activeTodoItem.boardId;

    if (boards.some((board) => board.id === over.id)) {
      // This is either an empty column or the last place of a column
      const newBoardId = over.id;

      // empty column or end of column?
      const todoItemsInOverBoard = todoItemsCollection.toArray.filter(
        (item) => item.boardId === newBoardId,
      );

      // If the column is empty, just change the boardId
      if (todoItemsInOverBoard.length === 0) {
        todoItemsCollection.update(active.id, (item) => {
          item.boardId = newBoardId as string;
        });
      } else {
        console.log("column is not empty");
        todoItemsCollection.update(active.id, (item) => {
          item.boardId = newBoardId as string;
        });
      }

      // console.log({ todoItemsInOverBoard });
      //
      // console.log({
      //   activeId,
      //   activeTodoItem,
      //   activeTodoItemId: activeTodoItem?.id,
      //   overBoardId: newBoardId,
      //   overBoard: boards.find((b) => b.id === newBoardId),
      // });
      // // Move between columns
      // todoItemsCollection.update(active.id, (item) => {
      //   item.boardId = newBoardId as string;
      // });
    } else {
      const overTodoId = todoItemsCollection.toArray.find(
        (item) => item.id === over.id,
      );

      if (overTodoId?.boardId === activeTodoItem.boardId) {
        // update positions within the same column
        console.log("Reorder within the same column");
      }
    }

    // TODO: change the id of the task
    // setActiveId(null);
    // setOverId(null);
    // const { active, over } = event;
    // if (!over) return;
    // if (active.id === over.id) return;
    //
    // // Find the dragged task
    // if (!activeTask) return;
    //
    // const updatedTasks = getUpdatedTasks({
    //   activeTask,
    //   over,
    //   tasks,
    //   active,
    //   statusColumns,
    // });
    // if (updatedTasks) {
    //   setTasks(updatedTasks);
    // }
  };

  return (
    <div className="flex-1 min-h-0">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4 h-full min-h-0">
          {boards.map((board) => (
            <Board
              board={board}
              key={board.id}
              activeId={activeId}
              overId={overId}
              activeTask={activeTodoItem}
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
