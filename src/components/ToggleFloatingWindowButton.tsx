import { DatabaseZapIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ToggleFloatingWindowButton({
  isClosed,
  activeStep,
  toggleWindow,
}: {
  toggleWindow: () => void;
  isClosed: boolean;
  activeStep: string | null;
}) {
  const referenceContainerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  });

  const containerWidth = useMemo(() => {
    if (mounted && isClosed && referenceContainerRef.current) {
      return referenceContainerRef.current.offsetWidth;
    } else {
      // default width
      return 56;
    }
  }, [isClosed, mounted]);

  const rotationDegrees = useMemo(() => {
    return isClosed ? 0 : 360;
  }, [isClosed]);

  return (
    <>
      <motion.button
        className="relative min-w-14 h-14 text-black inline-flex items-center justify-center gap-2 cursor-pointer bg-primary py-4 px-0 rounded-full hover:brightness-90 transition-all"
        type="button"
        onClick={() => toggleWindow()}
        animate={{
          // width: isClosed ? "auto" : "56px",
          width: `${containerWidth.toString()}px`,
        }}
        initial
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
      >
        <motion.div
          initial={false}
          animate={{
            rotate: rotationDegrees,
          }}
          className="absolute top-0 left-0 h-full flex items-center justify-center w-14 shrink-0"
        >
          <DatabaseZapIcon className="block" />
        </motion.div>
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
      {/*
        This is a reference container that we use
        to calculate the width of the button
      */}
      <div
        ref={referenceContainerRef}
        className="absolute h-0 overflow-hidden top-0 left-0 min-w-14 text-black inline-flex items-center justify-center gap-2 pointer-none whitespace-nowrap"
        aria-hidden="true"
      >
        <div className="w-6" aria-hidden="true" />
        <div className="mx-4 overflow-hidden" aria-hidden="true">
          {activeStep}
        </div>
      </div>
    </>
  );
}
