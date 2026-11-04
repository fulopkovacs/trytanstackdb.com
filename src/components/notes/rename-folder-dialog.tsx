import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { renameFolder } from "@/db/mutations";
import type { Folder } from "@/db/schema";

/**
 * Only checks what the browser can know. Whether the name is already taken
 * is the server's call: the rename shows up right away, and rolls back if
 * the server says no.
 */
const renameSchema = z.object({ name: z.string().trim().min(1, "Enter a folder name") });

/** Only folders without a role (not Notes or Quick Notes) can be renamed, like in Notes. */
export function canRenameFolder(folder: Pick<Folder, "role">): boolean {
  return folder.role === null;
}

export function RenameFolderDialog({
  folder,
  onOpenChange,
}: {
  /** The folder to rename; `null` closes the dialog. */
  folder: Folder | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={folder !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {folder && <RenameFolderForm folder={folder} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderForm({ folder, onDone }: { folder: Folder; onDone: () => void }) {
  const form = useForm({
    defaultValues: { name: folder.name },
    validators: { onChange: renameSchema },
    onSubmit: ({ value }) => {
      const name = value.name.trim();
      // Optimistic: close now, the new name is already everywhere.
      if (name !== folder.name) renameFolder(folder.id, name);
      onDone();
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogDescription>Folder names must be unique.</DialogDescription>
      </DialogHeader>
      <form.Field name="name">
        {(field) => (
          <div className="grid gap-1.5">
            <label htmlFor={field.name} className="sr-only">
              Folder name
            </label>
            <Input
              id={field.name}
              autoFocus
              autoComplete="off"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              onFocus={(event) => event.currentTarget.select()}
              aria-invalid={!field.state.meta.isValid}
            />
            {!field.state.meta.isValid && (
              <p className="text-[13px] text-destructive">
                {field.state.meta.errors.map((error) => error?.message).join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <Button type="submit" disabled={!canSubmit}>
              Rename
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}
