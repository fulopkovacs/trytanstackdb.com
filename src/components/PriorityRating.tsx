import { CircleIcon } from "lucide-react";
import { useCallback } from "react";
import { todoItemsCollection } from "@/collections/todoItems";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const icons = [
  <CircleIcon key="0" className="text-muted-foreground h-4 w-4" />,
  <span key="1" className="block text-red-500 font-bold text-sm">
    !
  </span>,
  <span key="2" className="block text-red-500 font-bold text-sm">
    !!
  </span>,
  <span key="3" className="block text-red-500 font-bold text-sm">
    !!!
  </span>,
];

export function PriorityRatingPopup({
  priority,
  todoItemId,
}: {
  todoItemId: string;
  priority: number | null;
}) {
  const handleUpdate = useCallback(
    (index: number) => {
      todoItemsCollection.update(todoItemId, (item) => {
        item.priority = index;
      });
    },
    [todoItemId],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="empty" size="icon" onPointerDown={handlePointerDown}>
          {icons[priority || 0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-0 flex flex-col items-center"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        {icons.map((icon, index) => (
          <DropdownMenuItem
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate(index);
            }}
            onPointerDown={handlePointerDown}
            className="w-8 h-8 flex items-center justify-center p-0"
          >
            {icon}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
