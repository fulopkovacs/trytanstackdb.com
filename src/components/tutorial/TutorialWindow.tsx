import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { DatabaseZapIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { deepDiveArticles, steps, tutorialArticles } from "@/data/tutorial";
import { cn } from "@/lib/utils";
import {
  getTutorialDataHandlers,
  type TutorialData,
} from "@/utils/getTutorialDataHandlers";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

function FloatingWindowHeader({ toggleWindow }: { toggleWindow: () => void }) {
  return (
    <div className="text-sm bg-linear-to-r from-orange-500 to-orange-700 border-b border-b-black px-2 py-1 flex items-center">
      <div className="flex items-center gap-1 font-bold grow">
        <DatabaseZapIcon className="h-4 w-4" /> TanStack DB Tutorial
      </div>
      <Button
        variant="tutorial"
        size="icon-xs"
        className="bg-transparent border-black rounded-full border"
        onClick={toggleWindow}
      >
        <XIcon className="" />
      </Button>
    </div>
  );
}

function FloatingWindow({
  toggleWindow,
  tutorialData,
  activeStep,
  setActiveStep,
}: {
  toggleWindow: () => void;
  tutorialData: TutorialData;
  activeStep: string | null;
  setActiveStep: (step: string) => void;
}) {
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [windowSize, setWindowSize] = useState(tutorialData.windowSize);

  // Store initial limits as constants that never change
  const INITIAL_MIN_WIDTH = 400;
  const INITIAL_MAX_WIDTH = 850;
  const INITIAL_MIN_HEIGHT = 300;
  const INITIAL_MAX_HEIGHT = 2000;

  const [
    { MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, MAX_HEIGHT },
    setWindowSizeLimits,
  ] = useState({
    MIN_WIDTH: INITIAL_MIN_WIDTH,
    MAX_WIDTH: INITIAL_MAX_WIDTH,
    MIN_HEIGHT: INITIAL_MIN_HEIGHT,
    MAX_HEIGHT: INITIAL_MAX_HEIGHT,
  });

  const updateWindowSizeLimits = useCallback(() => {
    if (typeof window !== "undefined") {
      // Calculate new limits based on current window size
      // MIN values: can't be larger than initial values, but can be smaller if window is small
      // MAX values: can grow and shrink with window size
      const newMinWidth = Math.min(window.innerWidth - 16, INITIAL_MIN_WIDTH);
      const newMinHeight = Math.min(
        window.innerHeight - 65,
        INITIAL_MIN_HEIGHT,
      );

      const newLimits = {
        MIN_WIDTH: newMinWidth,
        // MAX_WIDTH should be at least MIN_WIDTH but never exceed what fits in viewport
        MAX_WIDTH: Math.max(
          newMinWidth,
          Math.min(window.innerWidth * 0.9, INITIAL_MAX_WIDTH),
        ),
        MIN_HEIGHT: newMinHeight,
        // MAX_HEIGHT should be at least MIN_HEIGHT but never exceed what fits in viewport
        MAX_HEIGHT: Math.max(
          newMinHeight,
          Math.min(window.innerHeight * 0.75, INITIAL_MAX_HEIGHT),
        ),
      };

      setWindowSizeLimits(newLimits);

      // Clamp the current window size to fit within new limits
      // Use a callback to get the current state value, not the saved tutorialData value
      setWindowSize((currentSize) => ({
        width: Math.max(
          newLimits.MIN_WIDTH,
          Math.min(newLimits.MAX_WIDTH, currentSize.width),
        ),
        height: Math.max(
          newLimits.MIN_HEIGHT,
          Math.min(newLimits.MAX_HEIGHT, currentSize.height),
        ),
      }));
    }
  }, []);

  useEffect(() => {
    // Make sure the window size is within limits
    updateWindowSizeLimits();
    if (typeof window !== "undefined") {
      // getTutorialDataHandlers().then(({ tutorialData }) => {
      //   setWindowSize(tutorialData.windowSize);
      // });
      window.addEventListener("resize", updateWindowSizeLimits);
      return () => {
        window.removeEventListener("resize", updateWindowSizeLimits);
      };
    }
  }, [
    // Make sure the window size is within limits
    updateWindowSizeLimits,
  ]);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<
    "top" | "right" | "corner" | null
  >(null);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Debounced save to localStorage (only save after resize stops)
  useEffect(() => {
    if (isResizing) return; // Don't save while actively resizing

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      getTutorialDataHandlers().then(({ updateTutorialData }) => {
        updateTutorialData({
          windowSize,
        });
      });
    }, 100);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [windowSize, isResizing]);

  const handleStepChange = useCallback(
    async (stepTitle: string) => {
      // clear all highlights
      navigate({
        to: ".",
        search: ({ highlight: _, ...old }) => {
          return { ...old };
        },
      });

      const { tutorialData, updateTutorialData } =
        await getTutorialDataHandlers();

      tutorialData.tutorialStep = stepTitle;

      updateTutorialData({
        tutorialStep: stepTitle,
      });

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
  const handleScroll = async () => {
    const { updateTutorialData, tutorialData } =
      await getTutorialDataHandlers();
    // get current scroll positions
    if (scrollRef.current && activeStep) {
      updateTutorialData({
        tutorialStep: activeStep,
        scrollPositions: {
          ...tutorialData.scrollPositions,
          [activeStep]: scrollRef.current.scrollTop,
        },
      });
    }
  };

  // Resize handlers
  const handleResizeStart = (
    e: React.MouseEvent,
    direction: "top" | "right" | "corner",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: windowSize.width,
      height: windowSize.height,
    };
  };

  useEffect(() => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;

      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;

      if (resizeDirection === "right" || resizeDirection === "corner") {
        newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, resizeStart.current.width + deltaX),
        );
      }

      if (resizeDirection === "top" || resizeDirection === "corner") {
        // For top resize, we subtract deltaY because dragging up should increase height
        newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, resizeStart.current.height - deltaY),
        );
      }

      // Direct DOM manipulation - no React re-render
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      // Sync final size to React state
      if (containerRef.current) {
        const finalWidth = containerRef.current.offsetWidth;
        const finalHeight = containerRef.current.offsetHeight;
        setWindowSize({ width: finalWidth, height: finalHeight });
      }

      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeDirection,
    MAX_HEIGHT,
    MAX_WIDTH,
    MIN_HEIGHT,
    MIN_WIDTH,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-white text-black mb-2 shadow-lg rounded-lg shadow-orange-500/10 border border-orange-500 dark:border-orange-500/10 overflow-hidden relative",
        !isResizing && "transition-all",
        isResizing && "select-none",
      )}
      style={{
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        willChange: isResizing ? "width, height" : "auto",
        contain: isResizing ? "layout style paint" : "none",
      }}
    >
      {/* Top resize handle - larger hit area with invisible padding */}
      <div
        className="absolute top-0 left-0 right-0 cursor-ns-resize z-50 group h-2 -mt-1"
        onMouseDown={(e) => handleResizeStart(e, "top")}
      >
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 group-hover:bg-orange-500/30 transition-colors" />
      </div>

      {/* Right resize handle - larger hit area with invisible padding */}
      <div
        className="absolute top-0 right-0 bottom-0 cursor-ew-resize z-50 group -mr-1 w-2"
        onMouseDown={(e) => handleResizeStart(e, "right")}
      >
        <div className="absolute top-0 left-1/2 bottom-0 w-px -translate-x-1/2 group-hover:bg-orange-500/30 transition-colors" />
      </div>

      {/* Corner resize handle - larger hit area */}
      <div
        className="absolute top-0 right-0 cursor-nesw-resize z-50 group w-4 h-4 -mt-1 -mr-1"
        onMouseDown={(e) => handleResizeStart(e, "corner")}
      >
        <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/50 transition-colors rounded-full" />
      </div>

      <div className={cn("opacity-100 translate-y-0 h-full flex flex-col")}>
        <FloatingWindowHeader toggleWindow={toggleWindow} />
        <Tabs
          orientation="vertical"
          value={activeStep || undefined}
          onValueChange={handleStepChange}
          className={cn(
            "w-full flex-1 flex flex-row p-2 overflow-hidden",
            isResizing && "pointer-events-none",
          )}
        >
          <ScrollArea type="hover" className="h-full py-2">
            <TabsList className="w-48 flex-nowrap px-2 h-fit overflow-x-auto flex flex-col gap-2 text-sm text-balance">
              <a
                href="https://tanstack.com/db/latest"
                target="_blank"
                rel="noreferrer"
                className="text-black font-bold flex items-center hover:text-orange-500 transition-colors mb-2"
              >
                Official docs <ExternalLinkIcon className="h-4" />
              </a>
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
          <div
            ref={scrollRef}
            key={activeStep}
            onScroll={handleScroll}
            className={cn(
              "w-full h-full ml-4 overflow-y-auto overflow-x-hidden",
              isResizing && "pointer-events-none",
              isResizing ? "contain-strict" : "contain-none",
            )}
          >
            {steps.map((step) => (
              <TabsContent
                key={step.title}
                value={step.title}
                className="w-full overflow-x-hidden pb-3"
              >
                <div className="fade-in animate-in prose prose-sm prose-neutral prose-base bg-white text-black dark:prose-neutral dark:bg-white dark:text-black">
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
  const [isClosed, setIsClosed] = useState(tutorialData.isClosed);

  const { step: activeStepFromSearch } = useSearch({ strict: false });

  const [activeStep, setActiveStep] = useState(
    tutorialData.tutorialStep || steps[0].title,
  );

  useEffect(() => {
    if (activeStepFromSearch && typeof activeStepFromSearch === "string") {
      const stepInSearch = decodeURIComponent(activeStepFromSearch);
      if (steps.find((step) => step.title === stepInSearch)) {
        setActiveStep(stepInSearch);
      }
    }
  }, [activeStepFromSearch]);

  const router = useRouter();

  const toggleWindow = useCallback(async () => {
    setIsClosed((o) => !o);
    // TODO: Make this a hook or something, this looks dumb

    // TODO: do we need localStorage and cookies too???
    // TODO: clean this mess up
    const { updateTutorialData } = await getTutorialDataHandlers();

    /*
      We need to invalidate the route so that any components using
      the `tutorialData` from the loader get the updated data
      (important for the `tutorialData.windowSize`).
    */
    router.invalidate({
      filter: (route) => route.id === "/_tutorial",
    });

    updateTutorialData({
      isClosed: !isClosed,
    });
  }, [isClosed, router]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div className="w-0 h-0">
        <div
          className={
            "absolute bottom-0 left-0 p-2 z-51 overflow-hidden max-w-full"
          }
        >
          {!isClosed && (
            <motion.div
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <FloatingWindow
                toggleWindow={toggleWindow}
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
              width: isClosed ? "auto" : "56px",
            }}
            initial={false}
            transition={{
              duration: 0.2,
              delay: isClosed ? 0 : 0.2,
              ease: "easeInOut",
            }}
          >
            <div className="absolute top-0 left-0 h-full flex items-center justify-center w-14 shrink-0">
              <DatabaseZapIcon className="block" />
            </div>
            <div className="w-6 h-14" />
            <AnimatePresence>
              {isClosed && (
                <div className="mx-4 h-0 pointer-events-none opacity-0">
                  {activeStep}
                </div>
              )}
            </AnimatePresence>
            <motion.div
              initial={false}
              className="absolute right-0 top-0 m-4"
              animate={{
                opacity: isClosed ? 1 : 0,
              }}
              transition={{
                duration: isClosed ? 0.2 : 0,
                ease: "easeInOut",
                delay: isClosed ? 0.2 : 0,
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
