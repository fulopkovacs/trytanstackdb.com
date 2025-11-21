import { DatabaseZap } from "lucide-react";
import type { ProjectRecord } from "@/db/schema";
import { API, getDataFromApi } from "@/local-api";
import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <a
        target="_blank"
        href="https://tanstack.com/db/latest/docs/overview"
        className="flex items-center gap-2 text-sm cursor-pointer"
        rel="noopener"
      >
        <DatabaseZap className="h-4 text-orange-500" />
        <div>
          <span className="bg-linear-to-r bg-clip-text from-orange-500 to-orange-700 text-transparent">
            TanTanck DB Demo{" "}
          </span>
          <span className="text-muted-foreground">(unofficial!)</span>{" "}
        </div>
      </a>
      <button
        type="button"
        className="underline cursor-pointer"
        onClick={async () => {
          // fetch projects
          const res = await getDataFromApi<ProjectRecord[]>(
            API["/api/projects"].GET,
          );
          console.log({ res });
        }}
      >
        Print the projects to the console
      </button>
      <div className="flex items-center gap-4 ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
