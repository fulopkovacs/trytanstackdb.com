import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type UserTheme, useTheme } from "./theme-provider";

type ThemeToggleProps = {
  getTheme?: () => UserTheme;
};

function ThemeIcon({ theme }: { theme: UserTheme }) {
  const iconClass = "h-[1.2rem] w-[1.2rem]";

  if (theme === "system") {
    return <MonitorIcon className={iconClass} />;
  }
  if (theme === "dark") {
    return <MoonIcon className={iconClass} />;
  }
  return <SunIcon className={iconClass} />;
}

export function ModeToggle({ getTheme }: ThemeToggleProps) {
  const { setTheme, userTheme } = useTheme();
  const theme = getTheme ? getTheme() : userTheme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <ThemeIcon theme={theme} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as UserTheme)}
        >
          <DropdownMenuRadioItem value="light">
            <SunIcon />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
