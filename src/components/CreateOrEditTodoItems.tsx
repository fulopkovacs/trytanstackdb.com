import { generateKeyBetween } from "fractional-indexing";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import z from "zod";
import { todoItemsCollection } from "@/collections/todoItems";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TodoItemRecord } from "@/db/schema";
import { useAppForm } from "@/hooks/app.form";

export function CreateOrEditTodoItems({
  todoItem,
  children,
}: {
  todoItem: Partial<TodoItemRecord> & Pick<TodoItemRecord, "boardId">;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isNewItem = !todoItem.id;
  const actionName = isNewItem ? "Create Task" : "Edit Task";

  const form = useAppForm({
    defaultValues: {
      title: todoItem.title || "",
      description: todoItem.description || "",
    },
    onSubmit: async ({ value }) => {
      const itemId = todoItem.id || nanoid();

      // NOTE: It'd be better to use a manual transaction here to ensure both operations
      // succeed or fail together. However, we use D1 for the db, and it doesn't suppor
      // transactions yet, so we can't make an endpoint that does both of these operations

      if (isNewItem) {
        // Find the first position in the board to prepend the new item
        const itemsInBoard = todoItemsCollection.toArray
          .filter((item) => item.boardId === todoItem.boardId)
          .sort((a, b) => (a.position < b.position ? -1 : 1));

        const firstPosition = itemsInBoard[0]?.position;
        const newPosition = generateKeyBetween(null, firstPosition ?? null);

        todoItemsCollection.insert({
          id: itemId,
          boardId: todoItem.boardId,
          title: value.title,
          description: value.description,
          position: newPosition,
          priority: 0,
          createdAt: new Date(),
        });
      } else {
        todoItemsCollection.update(itemId, (item) => {
          item.title = value.title;
          item.description = value.description;
        });
      }

      setIsOpen(false);
    },
  });

  const handleOpenChange = useCallback(
    (newVal: boolean) => {
      if (newVal) {
        setIsOpen(true);
      } else {
        form.reset();
        setIsOpen(false);
      }
    },
    [form],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onKeyDown={(e) => {
          // Prevent <SPACE> from dragging the draggable task
          // when the dialog is open
          e.stopPropagation();

          // Cmd/Ctrl + Enter to submit the form
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            form.handleSubmit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{actionName}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(e);
          }}
        >
          <div className="grid gap-4 py-4">
            <form.AppField
              name="title"
              validators={{
                onSubmit: z.string().min(1, "Title is required"),
              }}
              children={(field) => <field.TextField label="Title" />}
            />

            {/* <Label htmlFor="name" className="text-right"> */}
            {/*   Title */}
            {/* </Label> */}
            {/* <Input id="name" value="Pedro Duarte" className="col-span-3" /> */}
            <form.AppField
              name="description"
              validators={{
                onSubmit: z.string().min(1, "Description is required"),
              }}
              children={(field) => <field.TextArea label="Description" />}
            />
            {/* <Label htmlFor="username" className="text-right"> */}
            {/*   Description */}
            {/* </Label> */}
            {/* <Input id="username" value="@peduarte" className="col-span-3" /> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
