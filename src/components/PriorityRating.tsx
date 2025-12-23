import { SkullIcon } from "lucide-react";
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
  <span key="0" className="block text-muted-foreground font-bold text-sm">
    !
  </span>,
  <span key="1" className="block font-bold text-current text-sm">
    !!
  </span>,
  <span key="2" className="block text-destructive font-bold text-sm">
    !!!
  </span>,
  <SkullIcon key="3" className="text-destructive h-4 w-4" />,
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
        <Button
          variant="empty"
          size="icon"
          onPointerDown={handlePointerDown}
          className="bg-muted hover:bg-muted/80 rounded-full"
        >
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
