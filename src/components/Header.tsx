import { ClientOnly } from "@tanstack/react-router";
import { BugIcon, GithubIcon } from "lucide-react";
import { ConfigureDB } from "./ConfigureDB";
import { ModeToggle } from "./mode-toggle";
import { NetworkLatencyConfigurator } from "./NetworkLatencyConfigurator";
import { NetworkPanelToggle } from "./NetworkPanelToggle";
import { ResetTheDbDialog } from "./ResetTheDbDialog";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

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
        <NetworkLatencyConfigurator />
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
        <NetworkPanelToggle />
      </ClientOnly>
    </header>
  );
}
