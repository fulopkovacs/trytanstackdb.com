import { DatabaseZap } from "lucide-react";
import { ConfigureDB } from "./ConfigureDB";
import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="flex gap-2 items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <a
        target="_blank"
        href="https://tanstack.com/db/latest/docs/overview"
        className="flex items-center gap-2 text-sm cursor-pointer"
        rel="noopener"
      >
        <DatabaseZap className="h-4 text-orange-500" />
        <span className="cursor-pointer bg-linear-to-r bg-clip-text from-orange-500 to-orange-700 text-transparent">
          TanStack DB Tutorial{" "}
        </span>
        <span className="underline">(docs)</span>
      </a>
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
      <div className="ml-auto">
        <ConfigureDB />
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
    </header>
  );
}
