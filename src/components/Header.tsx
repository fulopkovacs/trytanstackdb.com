import { eq, useLiveQuery } from "@tanstack/react-db";
import { ClientOnly } from "@tanstack/react-router";
import { BugIcon, GithubIcon, LoaderIcon, RotateCwIcon } from "lucide-react";
import { retryUnsyncedTodoItemsSync } from "@/collections/todoItems";
import {
  TODO_ITEMS_SYNC_STATE_ID,
  todoItemsSyncCollection,
} from "@/collections/todoItemsSync";
import { ApiLatencyConfigurator } from "./ApiLatencyConfigurator";
import { ApiPanelToggle } from "./ApiPanelToggle";
import { ConfigureDB } from "./ConfigureDB";
import { ModeToggle } from "./mode-toggle";
import { ResetTheDbDialog } from "./ResetTheDbDialog";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function RetryTodoItemsSyncButton() {
  const { data: syncState } = useLiveQuery((q) =>
    q
      .from({ syncState: todoItemsSyncCollection })
      .where(({ syncState }) => eq(syncState.id, TODO_ITEMS_SYNC_STATE_ID))
      .findOne(),
  );

  const failedCount = syncState?.failedItemIds.length ?? 0;
  const inFlightCount = syncState?.inFlightItemIds.length ?? 0;

  if (failedCount === 0) {
    return null;
  }

  const tooltipText = `Retries failed sync requests (${failedCount} pending failure${failedCount > 1 ? "s" : ""}). Local changes stay in the UI.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void retryUnsyncedTodoItemsSync();
            }}
            disabled={failedCount === 0}
          >
            {inFlightCount > 0 ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <RotateCwIcon />
            )}
            Retry sync
            {failedCount > 0 ? ` (${failedCount})` : ""}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="max-w-72">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Header() {
  return (
    <header className="flex gap-2 items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-1 text-sm font-medium">
        <a
          href="https://fulop.dev"
          target="_blank"
          rel="noreferrer"
          className="group/fuko-link cursor-pointer transition-colors flex items-center gap-2"
        >
          <img
            alt="fuko"
            src="https://avatars.githubusercontent.com/u/43729152?s=96&v=4"
            className="inline h-6 w-6 rounded-full border"
          />
          <span className="underline decoration-wavy group-hover/fuko-link:opacity-80 transition-opacity">
            fuko's
          </span>
        </a>
        guide to
        <a
          target="_blank"
          href="https://tanstack.com/db/latest/docs/overview"
          className="text-primary flex items-center cursor-pointer underline decoration-wavy hover:opacity-80"
          rel="noopener"
        >
          @tanstack/db
        </a>
      </div>
      <ClientOnly fallback={null}>
        <div className="ml-auto">
          <ConfigureDB />
        </div>
      </ClientOnly>
      <ClientOnly fallback={null}>
        <ResetTheDbDialog />
      </ClientOnly>
      <ClientOnly fallback={null}>
        <ApiLatencyConfigurator />
      </ClientOnly>
      <ClientOnly fallback={null}>
        <RetryTodoItemsSyncButton />
      </ClientOnly>
      <a
        href="https://github.com/fulopkovacs/trytanstackdb.com"
        target="_blank"
        rel="noreferrer"
      >
        <Button variant={"outline"} size="icon">
          <GithubIcon />
        </Button>
      </a>
      <a
        className="hidden lg:block"
        href="https://github.com/fulopkovacs/trytanstackdb.com/issues/new"
        target="_blank"
        rel="noreferrer"
      >
        <Button variant={"outline"}>
          <BugIcon /> Report a bug
        </Button>
      </a>
      <a
        className="block lg:hidden"
        href="https://github.com/fulopkovacs/trytanstackdb.com/issues/new"
        target="_blank"
        rel="noreferrer"
      >
        <Button variant={"outline"} size="icon">
          <BugIcon />
        </Button>
      </a>
      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
      <ClientOnly fallback={null}>
        <ApiPanelToggle />
      </ClientOnly>
    </header>
  );
}
