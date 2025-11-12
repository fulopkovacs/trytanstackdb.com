import { Link, useRouter } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

export function Header({
  loggedInUser,
}: {
  loggedInUser?: { name: string; id: string };
}) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <Link to="/">
        <Button variant="ghost" size="sm">
          Home
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {loggedInUser ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              router.navigate({
                to: "/logout",
              });
            }}
          >
            <LogOutIcon />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
