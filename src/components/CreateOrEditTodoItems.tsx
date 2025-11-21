import { createOptimisticAction } from "@tanstack/db";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import z from "zod";
import { projectsCollection } from "@/collections/projects";
import { insertTodoItem, todoItemsCollection } from "@/collections/todoItems";
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

type CreateTodoItemInput = {
  id: string;
  boardId: string;
  title: string;
  description: string;
  projectId: string;
  createdAtTimestampMs: number;
};

const createTodoItem = createOptimisticAction({
  id: "create-todo-item",
  autoCommit: true,
  onMutate: (newItemData: CreateTodoItemInput) => {
    todoItemsCollection.insert({
      createdAt: new Date(),
      ...newItemData,
      priority: 0,
    });

    projectsCollection.update(newItemData.projectId, (project) => {
      project.itemPositionsInTheProject[newItemData.boardId].unshift(
        newItemData.id,
      );
    });
  },
  mutationFn: async (newItemData: CreateTodoItemInput) => {
    // do something
    await insertTodoItem({
      data: newItemData,
    });
    await todoItemsCollection.utils.refetch();
    await projectsCollection.utils.refetch();
  },
});

export function CreateOrEditTodoItems({
  projectId,
  todoItem,
  children,
}: {
  projectId: string;
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
    onSubmit: ({ value }) => {
      const itemId = todoItem.id || nanoid();

      // NOTE: It'd be better to use a manual transaction here to ensure both operations
      // succeed or fail together. However, we use D1 for the db, and it doesn't suppor
      // transactions yet, so we can't make an endpoint that does both of these operations

      if (isNewItem) {
        createTodoItem({
          id: itemId,
          boardId: todoItem.boardId,
          projectId: projectId,
          title: value.title,
          description: value.description,
          createdAtTimestampMs: Date.now(),
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
