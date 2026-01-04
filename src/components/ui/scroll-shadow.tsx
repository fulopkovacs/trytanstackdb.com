import { cn } from "@/lib/utils";

export function ScrollShadow({
  position,
  visible,
  fromColor = "from-background",
}: {
  position: "top" | "bottom";
  visible: boolean;
  /** Tailwind `from-*` class for the gradient start color. Defaults to "from-background". */
  fromColor?: string;
}) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-10 pointer-events-none z-10 transition-opacity duration-300 ease-in-out",
        position === "top"
          ? `top-0 bg-linear-to-b ${fromColor} to-transparent`
          : `bottom-0 bg-linear-to-t ${fromColor} to-transparent`,
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
