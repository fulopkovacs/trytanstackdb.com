import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { DatabaseZapIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { steps } from "@/data/tutorial";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

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
  const [activeStep, setActiveStep] = useState(steps[0].title);

  return (
    <div
      className={cn(
        "bg-white text-black transition-all mb-2 shadow-lg rounded-lg shadow-orange-500/10 border border-orange-500 dark:border-orange-500/10 overflow-hidden",
        // isOpen ? "translate-y-0" : "pointer-events-none translate-y-2",
      )}
    >
      <div
        className={cn(
          "fade-in animate-in bg-orange-500 p-2",
          !isOpen ? "block" : "hidden",
        )}
      >
        {activeStep}
        <Button
          variant={"secondary"}
          size="icon-sm"
          onClick={toggleWindow}
          className="ml-2"
        >
          <Maximize2Icon className="w-4 h-4" />
        </Button>
      </div>
      <div
        className={cn(
          "transition-all",
          isOpen
            ? "block opacity-100 translate-y-0"
            : "hidden opacity-0 translate-y-2",
        )}
      >
        <FloatingWindowHeader toggleWindow={toggleWindow} />
        <Tabs
          orientation="vertical"
          value={activeStep}
          onValueChange={setActiveStep}
          className="w-full flex flex-row p-2 h-96 max-h-3/4"
        >
          <ScrollArea
            type="hover"
            className="h-full rounded-lg bg-neutral-200 py-2 px-1"
          >
            <TabsList className="w-40 flex-nowrap h-fit overflow-x-auto flex flex-col gap-2 text-sm text-balance">
              {steps.map((step, index) => (
                <TabsTrigger
                  key={step.title}
                  className="cursor-pointer flex-1 text-left bg-orange-500/0 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all data-[state=active]:bg-orange-500/100"
                  value={step.title}
                >
                  {step.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          <ScrollArea type="auto" className="w-full ml-4">
            {steps.map((step, index) => (
              <TabsContent
                key={step.title}
                value={step.title}
                className="overflow-y-auto"
              >
                <div className="prose prose-neutral prose-base bg-white text-black dark:prose-neutral dark:bg-white dark:text-black">
                  {<step.file />}
                </div>
              </TabsContent>
            ))}
            {/* Array.from({ length: 200 }).map((_, i) => (
              <div key={i}>{i.toString()}</div>
            )) */}
          </ScrollArea>
        </Tabs>
      </div>
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
      <div
        className={cn(
          "absolute bottom-0 left-0 p-2 z-[49]",
          isOpen ? "w-3xl" : "w-fit",
        )}
      >
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
