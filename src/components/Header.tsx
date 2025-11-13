import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <Link to="/">
        <Button variant="ghost" size="sm">
          Home
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  );
}
