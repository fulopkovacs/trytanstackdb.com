import { DatabaseZapIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function FloatingWindow({ isOpen }: { isOpen?: boolean }) {
  return (
    <div
      className={cn(
        "max-w-full md:max-w-2/3 w-7xl  bg-white text-black transition-all mb-2 shadow-lg rounded-lg p-4",
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 pointer-events-none translate-y-2",
      )}
    >
      Tutorial Window
    </div>
  );
}

export function TutorialWindow() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-0 h-0">
      <div className="absolute w-screen bottom-0 left-0 p-2 z-[100]">
        <FloatingWindow isOpen={isOpen} />
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
          className="rounded-full w-14 h-14 bg-orange-500 flex items-center justify-center shadow-lg hover:bg-orange-600  cursor-pointer transition-colors"
        >
          <DatabaseZapIcon className="text-black" />
        </button>
      </div>
    </div>
  );
}
