import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  );
}
