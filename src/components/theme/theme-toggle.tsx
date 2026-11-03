import { Monitor, Moon, Sun } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS = [
  { value: "system", label: "System theme", icon: Monitor },
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
] as const;

export function ThemeToggle() {
  const preference = useThemePreference();

  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={preference}
      onValueChange={(value) => {
        if (value) setThemePreference(value as ThemePreference);
      }}
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} title={label}>
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
