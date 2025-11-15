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
import { forwardRef, useMemo, useReducer, useState } from "react";
import { VList } from "virtua";
import { boardCollection } from "@/collections/boards";
import { todoItemsCollection } from "@/collections/todoItems";
import type { BoardRecord, TodoItemRecord } from "@/db/schema";
import { cn } from "@/lib/utils";
import { moveTask } from "@/utils/moveTask";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { projectsCollection } from "@/collections/projects";

const boardsWithOrderedIndices: Record<string, string[]> = {
  "7ErXIFradWmugLQZjH7-g": ["K7M010rU_wvr8dl_LaTgO", "bgyqWhfh3oLHpuGKUs_Ob"],
  k3Q5vDh5pPwP_HVobQURy: [
    "IDilD0xcSUjTNgLpL-lfu",
    "eh760eHuxc2cTdiTx03-D",
    "VldRR6G9Bfj6OE9CRdi4r",
  ],
  "3DrwI9dYM1JqsVyvX7TB8": ["4hkkUg06AtmdNC-ruYqGJ", "R6hBqf_b_ixtzU4j8pRN2"],
  // "l-KaavLifrxWmPGRaWj_8": [
  //   "Zm8DbZm9nsXJNX662RK4J",
  //   "XIz4dXmnB_mD8Rbznfkbb",
  //   "NjtfMl9VEe52VBBOa5kNf",
  // ],
  // "NX6vy0MjE7bq8HLl-nr47": ["RuHwN5G1dkz2pYQ_AEfix", "BaGMMdOeuJPFxD7SpnX6Y"],
  // snktqA5C2jAc5phTOllOe: ["OYY-25s6WqoOe-FLbCGEe", "OYY-25s6WqoOe-FLbCGEe"],
};

// Reducer function
function reducer<T extends Record<string, string[]>>(
  state: T,
  action: {
    type: "UPDATE_KEY";
    key: string;
    data?: string[];
  },
): T {
  switch (action.type) {
    case "UPDATE_KEY":
      if (!action.data) {
        console.error("No data provided for UPDATE_KEY action");
        return state;
      }

      return {
        ...state,
        [action.key]: action.data,
      };
    default:
      return state;
  }
}

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
      {task.id}
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
  orderedIds,
}: {
  board: BoardRecord;
  activeId: UniqueIdentifier | null;
  activeTask: TodoItemRecord | null;
  overId: UniqueIdentifier | null;
  orderedIds: string[];
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

  const orderedTodoItems = useMemo(() => {
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => {
      orderMap.set(id, idx);
    });

    return todoItems.sort((a, b) => {
      // If id not found, put it at the end
      const practicallyInfinite = 10_0000; // realistically we won't have this many items in this array
      const idxA = orderMap.get(a.id) ?? practicallyInfinite;
      const idxB = orderMap.get(b.id) ?? practicallyInfinite;
      return idxA - idxB;
    });
  }, [todoItems, orderedIds]);

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
            {board.id} ({todoItems.length} tasks)
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
          items={orderedTodoItems.map((task) => task.id)}
        >
          <VList>
            {orderedTodoItems.map((todoItem, i) => {
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

  const initialOrder = [
    "Zm8DbZm9nsXJNX662RK4J",
    "XIz4dXmnB_mD8Rbznfkbb",
    "NjtfMl9VEe52VBBOa5kNf",
  ];

  // const [inProgresIdsOrdered, setInProgressIdsOrdered] =
  //   useState<string[]>(initialOrder);

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

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? event.over.id : null);
  };

  // function dispatch({
  //   type,
  //   key,
  //   data,
  // }: {
  //   type: "UPDATE_KEY";
  //   key: string;
  //   data: string[];
  // }) {
  //   const state = project.itemPositionsInTheProject;
  //
  //   const updatedState = {
  //     ...state,
  //     [key]: data,
  //   };
  //
  //   projectsCollection.update(project.id, (item) => {
  //     item.itemPositionsInTheProject = updatedState;
  //   });
  // }
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
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;
    const state = project.itemPositionsInTheProject;

    // Find which column the dragged task is in
    // const activeBoard = activeTodoItem.boardId;

    if (boards.some((board) => board.id === over.id)) {
      // This is either an empty column or the last place of a column
      const newBoardId = over.id;
      const oldBoardId = activeTodoItem.boardId;

      todoItemsCollection.update(active.id, (item) => {
        item.boardId = newBoardId as string;
      });

      // // empty column or end of column?
      // const todoItemsInOverBoard = todoItemsCollection.toArray.filter(
      //   (item) => item.boardId === newBoardId,
      // );
      //
      // // If the column is empty, just change the boardId
      // if (todoItemsInOverBoard.length === 0) {
      //   todoItemsCollection.update(active.id, (item) => {
      //     item.boardId = newBoardId as string;
      //   });
      // } else {
      //   console.log("column is not empty");
      //   todoItemsCollection.update(active.id, (item) => {
      //     item.boardId = newBoardId as string;
      //   });
      // }

      // Update the ordered indices in the state
      const oldColumnIds = state[activeTodoItem.boardId] || [];
      const newColumnIds = state[newBoardId] || [];

      updatePositionsInProject({
        [oldBoardId]: oldColumnIds.filter((id) => id !== active.id),
        [newBoardId]: [...newColumnIds, active.id as string],
      });

      // dispatch({
      //   type: "UPDATE_KEY",
      //   key: oldBoardId,
      //   data: oldColumnIds.filter((id) => id !== active.id),
      // });
      // dispatch({
      //   type: "UPDATE_KEY",
      //   key: newBoardId as string,
      //   data: [...newColumnIds, active.id as string],
      // });
    } else {
      const overTodoItem = todoItemsCollection.toArray.find(
        (item) => item.id === over.id,
      );

      if (overTodoItem?.boardId === activeTodoItem.boardId) {
        console.log("Reorder within the same column");
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

        // dispatch({
        //   type: "UPDATE_KEY",
        //   key: activeTodoItem.boardId,
        //   data: newColumnTasks,
        // });
        // Merge reordered column tasks back into all tasks
        // setInProgressIdsOrdered(newColumnTasks);
      } else if (overTodoItem) {
        // Move to another column and insert at the correct position
        console.log(
          "Move to another column and insert at the correct position",
        );
        const oldColumnIds = state[activeTodoItem.boardId] || [];
        const newColumnIds = state[overTodoItem.boardId] || [];

        // const oldIndex = oldColumnIds.indexOf(active.id as string);
        const newIndex = newColumnIds.indexOf(over.id as string);

        const oldBoardId = activeTodoItem.boardId;
        const newBoardId = overTodoItem.boardId;

        todoItemsCollection.update(active.id, (item) => {
          item.boardId = newBoardId as string;
        });

        console.log({
          oldBoardId,
          newBoardId,
          newIndex,
        });

        newColumnIds.splice(newIndex, 0, activeTodoItem.id);

        updatePositionsInProject({
          [oldBoardId]: oldColumnIds.filter((id) => id !== active.id),
          [newBoardId]: newColumnIds,
        });

        // dispatch({
        //   type: "UPDATE_KEY",
        //   key: oldBoardId,
        //   data: oldColumnIds.filter((id) => id !== active.id),
        // });
        //
        // dispatch({
        //   type: "UPDATE_KEY",
        //   key: newBoardId,
        //   data: newColumnIds,
        // });
      } else {
        console.error("overTodoId not found");
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

  const sortedBoards = useMemo(
    () =>
      boards.sort((a) =>
        a.name === "Todo" ? -1 : a.name === "In Progress" ? -1 : 1,
      ),
    [boards],
  );

  return (
    <div className="flex-1 min-h-0">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4 h-full min-h-0">
          {sortedBoards.map((board) => (
            <Board
              board={board}
              key={board.id}
              activeId={activeId}
              overId={overId}
              activeTask={activeTodoItem}
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
