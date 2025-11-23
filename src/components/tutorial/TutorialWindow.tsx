import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useNavigate } from "@tanstack/react-router";
import { DatabaseZapIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { type ZodDefault, type ZodNumber, z } from "zod";
import { deepDiveArticles, steps, tutorialArticles } from "@/data/tutorial";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

export const TUTORIAL_DATA_LOCAL_STORAGE_KEY = "tutorialData";
export const TUTORIAL_COOKIE_NAME = "tutorialCookie";

export const tutorialDataSchema = z.object({
  tutorialStep: z.string().default(steps[0].title),
  scrollPositions: z.object(
    steps.reduce(
      (acc, step) => {
        acc[step.title] = z.number().default(0);
        return acc;
      },
      {} as Record<string, ZodDefault<ZodNumber>>,
    ),
  ),
});

export const DEFAULT_TUTORIAL_DATA_VALUE = JSON.stringify({
  scrollPositions: {},
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
      JSON.parse(tutorialInLocalStorage || DEFAULT_TUTORIAL_DATA_VALUE),
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
      <div className="flex items-center gap-1 font-bold grow">
        <DatabaseZapIcon className="h-5 w-5" /> TanStack DB Demo
      </div>
      <Button variant="tutorial" size="icon-sm" onClick={toggleWindow}>
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function FloatingWindow({
  // isOpen,
  toggleWindow,
  tutorialData,
  activeStep,
  setActiveStep,
}: {
  isOpen: boolean;
  toggleWindow: () => void;
  tutorialData: TutorialData;
  activeStep: string | null;
  setActiveStep: (step: string) => void;
}) {
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
        from: "/projects",
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
      setActiveStep,
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
    if (scrollRef.current && activeStep) {
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
      <div
        className={cn(
          "block opacity-100 translate-y-0",
          // isOpen
          //   ? "block opacity-100 translate-y-0"
          //   : "hidden opacity-0 translate-y-2",
        )}
      >
        <FloatingWindowHeader toggleWindow={toggleWindow} />
        <Tabs
          orientation="vertical"
          value={activeStep || undefined}
          onValueChange={handleStepChange}
          className="w-full flex flex-row p-2 h-96 max-h-3/4"
        >
          <ScrollArea type="hover" className="h-full py-2">
            <TabsList className="w-48 flex-nowrap px-2 h-fit overflow-x-auto flex flex-col gap-2 text-sm text-balance">
              {[
                {
                  sectionTitle: "Tutorial",
                  articles: tutorialArticles,
                },
                {
                  sectionTitle: "Deep Dive Articles",
                  articles: deepDiveArticles,
                },
              ].map(({ sectionTitle, articles }) => (
                <Fragment key={sectionTitle}>
                  <h3 className="font-bold">{sectionTitle}</h3>
                  <div className="border-l border-neutral-200 ml-3 pl-2 text-neutral-500 flex flex-col gap-1">
                    {articles.map((step) => (
                      <TabsTrigger
                        key={step.title}
                        className="cursor-pointer flex-1 text-left bg-orange-200/0 px-2 py-1 rounded-md hover:bg-orange-200/20 transition-all data-[state=active]:bg-orange-200 data-[state=active]:text-black hover:text-black"
                        value={step.title}
                      >
                        {step.title}
                      </TabsTrigger>
                    ))}
                  </div>
                </Fragment>
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
            // NOTE: we need to use this key to make sure the scrollPosition
            // does is tracked separately for the different steps
            key={activeStep}
            onScroll={handleScroll}
            className="w-full ml-4 block! overflow-x-hidden display"
          >
            {steps.map((step) => (
              <TabsContent
                key={step.title}
                value={step.title}
                className="overflow-y-auto w-full overflow-x-hidden pb-3"
              >
                <div className="prose prose-sm prose-neutral prose-base bg-white text-black dark:prose-neutral dark:bg-white dark:text-black">
                  {<step.file />}
                  {step.nextStepName && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          step.nextStepName &&
                          handleStepChange(step.nextStepName)
                        }
                        className="text-orange-500 underline hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        Next: {step.nextStepName}
                      </button>
                    </div>
                  )}
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

  const [activeStep, setActiveStep] = useState(
    tutorialData.tutorialStep || steps[0].title,
  );

  const toggleWindow = useCallback(() => {
    setIsOpen((o) => !o);
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div className="w-0 h-0">
        <div className={"absolute bottom-0 left-0 p-2 z-49 overflow-hidden"}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <FloatingWindow
                toggleWindow={toggleWindow}
                isOpen={isOpen}
                tutorialData={tutorialData}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
              />
            </motion.div>
          )}
          <motion.button
            className="relative min-w-14 h-14 text-black inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-500 py-4 px-0 rounded-full hover:bg-orange-600"
            type="button"
            onClick={() => toggleWindow()}
            animate={{
              width: !isOpen ? "auto" : "56px",
            }}
            initial={false}
            transition={{
              duration: 0.2,
              delay: !isOpen ? 0 : 0.2,
              ease: "easeInOut",
            }}
          >
            <div className="absolute top-0 left-0 h-full flex items-center justify-center w-14 shrink-0">
              <DatabaseZapIcon className="block" />
            </div>
            <div className="w-6 h-14" />
            <AnimatePresence>
              {!isOpen && (
                <div className="mx-4 h-0 pointer-events-none opacity-0">
                  {activeStep}
                </div>
              )}
            </AnimatePresence>
            <motion.div
              initial={false}
              className="absolute right-0 top-0 m-4"
              animate={{
                opacity: !isOpen ? 1 : 0,
              }}
              transition={{
                duration: !isOpen ? 0.2 : 0,
                ease: "easeInOut",
                delay: !isOpen ? 0.2 : 0,
              }}
            >
              {activeStep}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </AnimatePresence>
  );
}
