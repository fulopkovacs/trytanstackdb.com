import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Status, StatusColumnType, Task } from "@/data/mockTasks";
import { moveTask } from "./moveTask";

export function getUpdatedTasks({
  activeTask,
  over,
  tasks,
  statusColumns,
  active,
}: {
  activeTask: Task;
  over: { id: UniqueIdentifier };
  tasks: Task[];
  active: { id: UniqueIdentifier };
  statusColumns: StatusColumnType[];
}) {
  // Find which column the dragged task is in
  const activeColumn = activeTask.status;
  // Find which column the target task is in
  const overTask = tasks.find((t) => t.id === over.id);
  const overColumn = overTask ? overTask.status : null;

  // TODO: code might be trash performance-wise, optimize it later...
  if (overTask && activeColumn === overColumn) {
    // Reorder within the same column
    const columnTasks = tasks.filter((t) => t.status === activeColumn);
    const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
    const newIndex = columnTasks.findIndex((t) => t.id === over.id);
    // Reorder the tasks in the column
    // All indices below the new position got decreased by 1
    const newColumnTasks = moveTask(columnTasks, oldIndex, newIndex);
    // Merge reordered column tasks back into all tasks
    const newTasks = tasks
      .filter((t) => t.status !== activeColumn)
      .concat(newColumnTasks);
    return newTasks;
  } else if (overTask && activeColumn !== overColumn) {
    // Move to another column and insert at the correct position
    const columnTasks = tasks.filter((t) => t.status === overColumn);
    const newIndex = columnTasks.findIndex((t) => t.id === over.id);
    const filteredTasks = tasks.filter(
      (t) => t.status !== overColumn && t.id !== active.id,
    );
    const newTask = { ...activeTask, status: overColumn as Status };
    columnTasks.splice(newIndex, 0, newTask);
    return [...filteredTasks, ...columnTasks];
  } else if (statusColumns.some((col) => col.id === over.id)) {
    // This is either an empty column or the last place of a column
    const columnTasks = tasks.filter((t) => t.status === over.id);

    if (columnTasks.length === 0) {
      // If the column is empty, just change the status
      return tasks.map((t) =>
        t.id === active.id ? { ...t, status: over.id as Status } : t,
      );
    } else {
      // If the column is not empty, add to the end of the column
      const filteredTasks = tasks.filter((t) => t.id !== active.id);
      const newTask = { ...activeTask, status: over.id as Status };
      return [...filteredTasks, newTask];
    }
  }
}
