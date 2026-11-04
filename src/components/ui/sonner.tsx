import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

import { useThemePreference } from "@/lib/theme";

function Toaster(props: ToasterProps) {
  const theme = useThemePreference();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{ classNames: { description: "text-muted-foreground!" } }}
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        error: <CircleAlert className="size-4" />,
        loading: <LoaderCircle className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
