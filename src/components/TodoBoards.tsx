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
import { forwardRef, useMemo, useState } from "react";
import type { StatusColumnType, Task } from "@/data/mockTasks";
import { cn } from "@/lib/utils";
import { getUpdatedTasks } from "@/utils/getUpdatedTasks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { VList } from "virtua";

const statusColumns: StatusColumnType[] = [
  {
    id: "todo",
    name: "To Do",
    description: "Tasks that need to be started",
    color: "#FFB300",
  },
  {
    id: "in-progress",
    name: "In Progress",
    description: "Tasks currently being worked on",
    color: "#1976D2",
  },
  {
    id: "done",
    name: "Done",
    description: "Tasks that have been completed",
    color: "#43A047",
  },
];

const TaskBase = forwardRef<
  HTMLDivElement,
  { task: Task } & React.HTMLAttributes<HTMLDivElement>
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

function DraggableTask({ task }: { task: Task }) {
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

function DraggedTaskSlot({ activeTask }: { activeTask: Task }) {
  return (
    <TaskBase task={activeTask} className="bg-cyan-100 dark:bg-cyan-950/80" />
  );
}

function StatusColumn({
  columnData: { name, id, description, color },
  tasks,
  activeId,
  activeTask,
  overId,
}: {
  columnData: StatusColumnType;
  tasks: Task[];
  activeId: UniqueIdentifier | null;
  activeTask: Task | null;
  overId: UniqueIdentifier | null;
}) {
  const columnTasks = useMemo(
    () => tasks.filter((task) => task.status === id),
    [tasks, id],
  );

  const activeTaskIndex = useMemo(
    () => columnTasks.findIndex((t) => t.id === activeId),
    [columnTasks, activeId],
  );

  const { setNodeRef, isOver } = useDroppable({ id });

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
            {name} ({columnTasks.length} tasks)
          </div>
        </CardTitle>
        <CardDescription className="min-h-10">{description}</CardDescription>
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
          items={columnTasks.map((task) => task.id)}
        >
          <VList>
            {columnTasks.map((task, i) => {
              const showDropIndicator =
                activeId &&
                overId === task.id &&
                activeId !== task.id &&
                // We don't want the drop indicator to be shown
                // right below the active task
                activeTaskIndex + 1 !== i;

              return (
                <div key={`${task.id}-wrapper`}>
                  {showDropIndicator && activeTask && (
                    <DraggedTaskSlot activeTask={activeTask} />
                  )}
                  <DraggableTask task={task} />
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

export function TodoBoards({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === activeId) || null;
  }, [tasks, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? event.over.id : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // Find the dragged task
    if (!activeTask) return;

    const updatedTasks = getUpdatedTasks({
      activeTask,
      over,
      tasks,
      active,
      statusColumns,
    });
    if (updatedTasks) {
      setTasks(updatedTasks);
    }
  };

  return (
    <div className="flex-1 min-h-0">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4 h-full min-h-0">
          {statusColumns.map((column) => (
            <StatusColumn
              key={column.id}
              columnData={column}
              tasks={tasks}
              activeId={activeId}
              overId={overId}
              activeTask={activeTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskBase task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
