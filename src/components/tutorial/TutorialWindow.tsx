import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useNavigate } from "@tanstack/react-router";
import { DatabaseZapIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import z from "zod";
import { steps } from "@/data/tutorial";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

export const TUTORIAL_DATA_LOCAL_STORAGE_KEY = "tutorialData";
export const TUTORIAL_COOKIE_NAME = "tutorialCookie";

export const tutorialDataSchema = z.object({
  tutorialStep: z.string().nullable(),
  scrollPositions: z.record(z.string(), z.number()),
});

export type TutorialData = {
  tutorialStep: string | null;
  scrollPositions: Record<string, number>;
};

function getTutorialDataLocally(w: Window): TutorialData {
  const tutorialInLocalStorage = w.localStorage.getItem(
    TUTORIAL_DATA_LOCAL_STORAGE_KEY,
  );

  let tutorialData: TutorialData;

  try {
    tutorialData = tutorialDataSchema.parse(
      tutorialInLocalStorage ? JSON.parse(tutorialInLocalStorage) : {},
    );
  } catch (e) {
    console.error("Error parsing tutorial data from localStorage:", e);
    tutorialData = {
      tutorialStep: null,
      scrollPositions: {},
    };
  }

  return tutorialData;
}

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

function MinimizedFloatingWindow({
  isOpen,
  toggleWindow,
  children,
}: {
  isOpen: boolean;
  toggleWindow: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "fade-in animate-in bg-orange-500 p-2  items-center gap-1 cursor-pointer hover:bg-orange-600 transition-colors",
        !isOpen ? "flex" : "hidden",
      )}
      onClick={toggleWindow}
    >
      <div className="shrink wrap-break-word">{children}</div>
      <Button variant={"secondary"} size="icon-sm">
        <Maximize2Icon className="" />
      </Button>
    </div>
  );
}

function FloatingWindow({
  isOpen,
  toggleWindow,
  tutorialData,
}: {
  isOpen: boolean;
  toggleWindow: () => void;
  tutorialData: TutorialData;
}) {
  const [activeStep, setActiveStep] = useState(
    tutorialData.tutorialStep || steps[0].title,
  );
  // const [scrollPositions, dispatch] = useReducer(
  //   (state: Record<string, number>, action: { step: string; pos: number }) => {
  //     return {
  //       ...tutorialData.scrollPositions,
  //       ...state,
  //       [action.step]: action.pos,
  //     };
  //   },
  //   tutorialData.scrollPositions || {},
  // )

  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStepChange = useCallback(
    (stepTitle: string) => {
      // clear all highlights
      navigate({
        to: ".",
        search: ({ highlight: _, ...old }) => {
          return { ...old };
        },
      });

      if (typeof window !== "undefined") {
        // TODO: do we need localStorage and cookies too???
        // TODO: clean this mess up
        const tutorialData: TutorialData = getTutorialDataLocally(window);

        tutorialData.tutorialStep = stepTitle;

        const tutorialDataJson = JSON.stringify(tutorialData);

        // biome-ignore lint/suspicious/noDocumentCookie: we need this cookie!
        window.document.cookie = `${TUTORIAL_COOKIE_NAME}=${tutorialDataJson}; path=/;`;
        window.localStorage.setItem(
          TUTORIAL_DATA_LOCAL_STORAGE_KEY,
          tutorialDataJson,
        );
      }
      setActiveStep(stepTitle);
    },
    [
      // clear all highlights
      navigate,
    ],
  );

  // Restore scroll position on mount
  useEffect(() => {
    if (tutorialData.tutorialStep) {
      const saved = tutorialData.scrollPositions[tutorialData.tutorialStep];
      if (saved && scrollRef.current) {
        scrollRef.current.scrollTop = parseInt(saved.toString(), 10);
      }
    }
  }, [tutorialData]);

  // Save scroll position on scroll
  const handleScroll = () => {
    const tutorialData: TutorialData = getTutorialDataLocally(window);
    // get current scroll positions
    if (scrollRef.current) {
      const tutorialDataJson = JSON.stringify({
        tutorialStep: activeStep,
        scrollPositions: {
          ...tutorialData.scrollPositions,
          [activeStep]: scrollRef.current.scrollTop,
        },
      } satisfies TutorialData);

      // biome-ignore lint/suspicious/noDocumentCookie: we need this>
      window.document.cookie = `${TUTORIAL_COOKIE_NAME}=${tutorialDataJson}; path=/;`;
      localStorage.setItem(TUTORIAL_DATA_LOCAL_STORAGE_KEY, tutorialDataJson);
    }
  };

  return (
    <div
      className={cn(
        "bg-white text-black transition-all mb-2 shadow-lg rounded-lg shadow-orange-500/10 border border-orange-500 dark:border-orange-500/10 overflow-hidden",
        // isOpen ? "translate-y-0" : "pointer-events-none translate-y-2",
      )}
    >
      <MinimizedFloatingWindow isOpen={isOpen} toggleWindow={toggleWindow}>
        {activeStep}
      </MinimizedFloatingWindow>
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
          onValueChange={handleStepChange}
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
          {/*
              NOTE: Scrollbar had issues with code blacks that were too wide
              */}
          {/* <ScrollArea */}
          {/*   type="auto" */}
          {/*   className="w-full ml-4 !block overflow-x-hidden display" */}
          {/*   doNotUseTable */}
          {/* > */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full ml-4 !block overflow-x-hidden display"
          >
            {steps.map((step, index) => (
              <TabsContent
                key={step.title}
                value={step.title}
                className="overflow-y-auto w-full overflow-x-hidden pb-3"
              >
                <div className="prose prose-sm prose-neutral prose-base bg-white text-black dark:prose-neutral dark:bg-white dark:text-black">
                  {<step.file />}
                </div>
              </TabsContent>
            ))}
            {/* </ScrollArea> */}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export function TutorialWindow({
  tutorialData,
}: {
  tutorialData: TutorialData;
}) {
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
        <FloatingWindow
          toggleWindow={toggleWindow}
          isOpen={isOpen}
          tutorialData={tutorialData}
        />
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
