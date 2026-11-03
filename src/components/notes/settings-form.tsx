import { useForm } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateAccountSettings, useAccount, useFolders } from "@/data/notes-data";
import type { AccountSettings } from "@/data/notes-data";
import { accountSchema, newNoteStyleSchema, sortNotesBySchema } from "@/fixtures";
import type { NewNoteStyle, SortNotesBy } from "@/fixtures";
import { cn } from "@/lib/utils";

import { AccountAvatar } from "./icons";

const accountSettingsSchema = accountSchema.pick({
  name: true,
  email: true,
  defaultFolderId: true,
  sortNotesBy: true,
  newNotesStartWith: true,
  groupNotesByDate: true,
});

const SORT_LABELS: Record<SortNotesBy, string> = {
  dateEdited: "Date Edited",
  dateCreated: "Date Created",
  title: "Title",
};

const NEW_NOTE_LABELS: Record<NewNoteStyle, string> = {
  title: "Title",
  heading: "Heading",
  body: "Body",
};

interface SettingsFormProps {
  /** Cards sit on the macOS content background or the iOS grouped background. */
  variant: "mac" | "ios";
}

export function SettingsForm({ variant }: SettingsFormProps) {
  const account = useAccount();
  const folders = useFolders();

  const defaultValues: AccountSettings = {
    name: account.name,
    email: account.email,
    defaultFolderId: account.defaultFolderId,
    sortNotesBy: account.sortNotesBy,
    newNotesStartWith: account.newNotesStartWith,
    groupNotesByDate: account.groupNotesByDate,
  };

  const form = useForm({
    defaultValues,
    validators: { onChange: accountSettingsSchema },
    onSubmit: async ({ value, formApi }) => {
      await updateAccountSettings(value);
      formApi.reset(value);
    },
  });

  const card =
    variant === "ios"
      ? "rounded-[26px] bg-ios-card"
      : "rounded-xl border border-mac-separator bg-black/[0.025] dark:bg-white/[0.04]";
  const usedPercent = Math.round((account.storageUsedGb / account.storageTotalGb) * 100);

  return (
    <form
      className={cn("space-y-6", variant === "ios" ? "text-[17px]" : "text-[13px]")}
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className={cn(card, "flex items-center gap-4 p-4")}>
        <AccountAvatar name={account.name} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.15em] font-semibold">{account.name}</p>
          <p className="truncate text-[0.95em] opacity-60">{account.email}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-notes-accent"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[0.85em] opacity-60">
            {account.plan} · {account.storageUsedGb} GB of {account.storageTotalGb} GB used
          </p>
        </div>
      </div>

      <SettingsGroup title="Account" className={card}>
        <form.Field name="name">
          {(field) => (
            <SettingsRow
              label="Name"
              htmlFor={field.name}
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
                className="w-full max-w-64 text-right"
              />
            </SettingsRow>
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <SettingsRow
              label="Email"
              htmlFor={field.name}
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
                className="w-full max-w-64 text-right"
              />
            </SettingsRow>
          )}
        </form.Field>
      </SettingsGroup>

      <SettingsGroup title="Notes" className={card}>
        <form.Field name="defaultFolderId">
          {(field) => (
            <SettingsRow label="Default folder" htmlFor={field.name}>
              <Select value={field.state.value} onValueChange={field.handleChange}>
                <SelectTrigger id={field.name} size="sm" className="min-w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
        </form.Field>
        <form.Field name="sortNotesBy">
          {(field) => (
            <SettingsRow label="Sort notes by" htmlFor={field.name}>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(sortNotesBySchema.parse(value))}
              >
                <SelectTrigger id={field.name} size="sm" className="min-w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {sortNotesBySchema.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
        </form.Field>
        <form.Field name="newNotesStartWith">
          {(field) => (
            <SettingsRow label="New notes start with" htmlFor={field.name}>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(newNoteStyleSchema.parse(value))}
              >
                <SelectTrigger id={field.name} size="sm" className="min-w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {newNoteStyleSchema.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {NEW_NOTE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
        </form.Field>
        <form.Field name="groupNotesByDate">
          {(field) => (
            <SettingsRow label="Group notes by date" htmlFor={field.name}>
              <Switch
                id={field.name}
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                className="data-checked:bg-[#34c759] dark:[&>span]:bg-white"
              />
            </SettingsRow>
          )}
        </form.Field>
      </SettingsGroup>

      <form.Subscribe
        selector={(state) => [state.isDirty, state.canSubmit, state.isSubmitting] as const}
      >
        {([isDirty, canSubmit, isSubmitting]) => (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => form.reset()}>
              Revert
            </Button>
            <Button type="submit" disabled={!isDirty || !canSubmit || isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}

function firstError(errors: unknown[]): string | undefined {
  const [error] = errors;
  if (!error) return undefined;
  if (typeof error === "string") return error;
  return (error as { message?: string }).message;
}

function SettingsGroup({
  title,
  className,
  children,
}: {
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1.5 px-4 text-[0.85em] font-semibold tracking-wide uppercase opacity-55">
        {title}
      </h2>
      <div className={cn(className, "divide-y divide-mac-separator dark:divide-white/10")}>
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="flex min-h-8 items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="shrink-0">
          {label}
        </label>
        <div className="flex min-w-0 flex-1 justify-end">{children}</div>
      </div>
      {error && <p className="mt-1 text-right text-[0.85em] text-destructive">{error}</p>}
    </div>
  );
}
