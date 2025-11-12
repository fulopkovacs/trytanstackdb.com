export function moveTask<T>(
  columnTasks: T[],
  oldIndex: number,
  newIndex: number,
): T[] {
  const newColumnTasks = columnTasks.slice(); // Copy array
  if (oldIndex < 0 || oldIndex >= newColumnTasks.length) return newColumnTasks;
  let targetIndex = newIndex;
  if (oldIndex < newIndex) targetIndex--;
  const [item] = newColumnTasks.splice(oldIndex, 1);
  newColumnTasks.splice(targetIndex, 0, item);
  return newColumnTasks;
}
