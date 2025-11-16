import { DatabaseZapIcon, Minimize2Icon, MinimizeIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

function FloatingWindowHeader({ toggleWindow }: { toggleWindow: () => void }) {
  return (
    <div className="border-b border-b-black p-2 flex items-center">
      <div className="flex items-center gap-1 font-bold flex-grow">
        <DatabaseZapIcon className="h-5 w-5" /> TanStack DB Demo
      </div>
      <Button variant={"secondary"} size="icon-sm" onClick={toggleWindow}>
        <Minimize2Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function FloatingWindow({
  isOpen,
  toggleWindow,
}: {
  isOpen: boolean;
  toggleWindow: () => void;
}) {
  return (
    <div
      className={cn(
        "max-w-full md:max-w-2/3 w-7xl bg-white text-black transition-all mb-2 shadow-lg rounded-lg shadow-orange-500/10 border border-orange-500 dark:border-orange-500/10",
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 pointer-events-none translate-y-2",
      )}
    >
      <FloatingWindowHeader toggleWindow={toggleWindow} />
      <div className="p-2">content</div>
    </div>
  );
}

export function TutorialWindow() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleWindow = useCallback(() => {
    setIsOpen((o) => !o);
  }, []);

  return (
    <div className="w-0 h-0">
      <div className="absolute w-screen bottom-0 left-0 p-2 z-[100]">
        <FloatingWindow toggleWindow={toggleWindow} isOpen={isOpen} />
        <button
          onClick={toggleWindow}
          type="button"
          className="rounded-full w-14 h-14 bg-orange-500 flex items-center justify-center shadow-lg hover:bg-orange-600  cursor-pointer transition-colors"
        >
          <DatabaseZapIcon className="text-black" />
        </button>
      </div>
    </div>
  );
}
