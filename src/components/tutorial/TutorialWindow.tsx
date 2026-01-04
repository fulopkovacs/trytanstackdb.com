import { Tabs, TabsContent } from "@radix-ui/react-tabs";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { CheckIcon, DatabaseZapIcon, LinkIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { steps as articles } from "@/data/tutorial";
import { useScrollShadow } from "@/hooks/use-scroll-shadow";
import { cn } from "@/lib/utils";
import {
  getTutorialDataHandlers,
  type TutorialData,
} from "@/utils/getTutorialDataHandlers";
import { ToggleFloatingWindowButton } from "../ToggleFloatingWindowButton";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { ScrollShadow } from "../ui/scroll-shadow";
import { TutorialTableOfContents } from "./TutorialTableOfContents";

function CopyArticleLinkButton({ activeStep }: { activeStep: string | null }) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(() => {
    if (!activeStep) return;

    const url = new URL(window.location.href);
    url.searchParams.set(
      "article",
      encodeURIComponent(activeStep.toLowerCase()),
    );

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeStep]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyLink}
      className="absolute top-2 right-4 z-20"
      title="Copy link to this article"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CheckIcon className="h-4 w-4 text-green-600" />
          </motion.div>
        ) : (
          <motion.div
            key="link"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LinkIcon className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

function FloatingWindowHeader({ toggleWindow }: { toggleWindow: () => void }) {
  return (
    <div className="text-sm bg-linear-to-r bg-primary text-primary-foreground border-b border-border dark:border-b-primary px-2 py-1 flex items-center">
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
  tutorialData,
  activeStep,
  setActiveStep,
  toggleWindow,
}: {
  tutorialData: TutorialData;
  activeStep: string | null;
  setActiveStep: (step: string) => void;
  toggleWindow: () => void;
}) {
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { canScrollUp, canScrollDown } = useScrollShadow(scrollRef, [
    activeStep,
  ]);

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

  // Restore scroll position on step change (useLayoutEffect to avoid flicker)
  useLayoutEffect(() => {
    if (activeStep) {
      const saved = tutorialData.scrollPositions[activeStep];
      if (saved && scrollRef.current) {
        scrollRef.current.scrollTop = saved;
      }
    }
  }, [activeStep, tutorialData.scrollPositions]);

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
        "mb-2 drop-shadow-md dark:drop-shadow-lg bg-card  rounded-lg border border-border dark:border-primary/50 relative",
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

      <div
        className={cn(
          "opacity-100 translate-y-0 h-full flex flex-col overflow-hidden rounded-lg",
        )}
      >
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
            <TutorialTableOfContents
              activeStep={activeStep}
              onStepChange={handleStepChange}
            />
          </ScrollArea>
          <div
            className={cn(
              "relative w-full h-full ml-4 min-w-0 overflow-hidden",
              isResizing && "pointer-events-none",
            )}
          >
            <CopyArticleLinkButton activeStep={activeStep} />
            <ScrollShadow
              position="top"
              visible={canScrollUp}
              fromColor="from-card"
            />
            <div
              ref={scrollRef}
              key={activeStep}
              onScroll={handleScroll}
              className={cn(
                "h-full overflow-y-auto overflow-x-hidden",
                isResizing ? "contain-strict" : "contain-none",
              )}
            >
              {articles.map((step) => (
                <TabsContent
                  key={step.title}
                  value={step.title}
                  className="w-full overflow-x-hidden pb-3"
                >
                  <div className="fade-in animate-in prose dark:prose-invert prose-md prose-neutral prose-base rounded-lg">
                    {<step.file />}
                    {step.nextStepName && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() =>
                            step.nextStepName &&
                            handleStepChange(step.nextStepName)
                          }
                          className="text-primary underline hover:brightness-75 transition-colors cursor-pointer"
                        >
                          Next: {step.nextStepName}
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
            <ScrollShadow
              position="bottom"
              visible={canScrollDown}
              fromColor="from-card"
            />
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

  const { article: activeArticleFromSearch } = useSearch({ strict: false });

  const [activeStep, setActiveStep] = useState(
    tutorialData.tutorialStep || articles[0].title,
  );

  useEffect(() => {
    if (
      activeArticleFromSearch &&
      typeof activeArticleFromSearch === "string"
    ) {
      const articleInSearch = decodeURIComponent(
        activeArticleFromSearch.toLowerCase(),
      );

      if (articles.find((a) => a.title === articleInSearch)) {
        setActiveStep(articleInSearch);
      }
    }
  }, [activeArticleFromSearch]);

  const router = useRouter();

  const toggleWindow = useCallback(async () => {
    setIsClosed((o) => !o);
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
    <div className="w-0 h-0">
      <div
        className={
          "absolute bottom-0 left-0 p-2 z-50 overflow-hidden max-w-full"
        }
      >
        <AnimatePresence initial={false}>
          {!isClosed && (
            <motion.div
              key="floating-window"
              initial={{
                opacity: 0,
                translateY: 10,
                filter: "blur(4px)", // add blur to initial
              }}
              animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, translateY: 10, filter: "blur(4px)" }} // add blur to exit
              transition={{
                translateY: {
                  type: "spring",
                  stiffness: 600,
                },
                opacity: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
                filter: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              }}
            >
              <FloatingWindow
                tutorialData={tutorialData}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                toggleWindow={toggleWindow}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <ToggleFloatingWindowButton
          isClosed={isClosed}
          activeStep={activeStep}
          toggleWindow={toggleWindow}
        />
      </div>
    </div>
  );
}
