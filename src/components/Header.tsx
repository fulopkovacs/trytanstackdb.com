import { ClientOnly } from "@tanstack/react-router";
import { BugIcon, DatabaseZap, GithubIcon } from "lucide-react";
import { ConfigureDB } from "./ConfigureDB";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  return (
    <header className="flex gap-2 items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <SidebarTrigger className="md:hidden" />
      <a
        target="_blank"
        href="https://tanstack.com/db/latest/docs/overview"
        className="flex items-center text-sm cursor-pointer"
        rel="noopener"
      >
        <DatabaseZap className="h-4 text-orange-500" />
        <span className="cursor-pointer bg-linear-to-r bg-clip-text from-orange-500 to-orange-700 text-transparent">
          TanStack DB Tutorial{" "}
        </span>
      </a>
      <span className="text-sm">BETA</span>
      <span className="text-muted-foreground text-sm">by</span>
      <a
        href="https://fulop.dev"
        target="_blank"
        rel="noreferrer"
        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
      >
        <img
          alt="fuko"
          src="https://avatars.githubusercontent.com/u/43729152?s=96&v=4"
          className="inline h-6 w-6 rounded-full"
        />
        fuko
      </a>
      <ClientOnly fallback={null}>
        <div className="ml-auto">
          <ConfigureDB />
        </div>
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
    </header>
  );
}
