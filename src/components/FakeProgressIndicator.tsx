import { useEffect, useRef } from "react";

export function FakeProgressIndicator() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /*
      NOTE: This runs twice, so the progress animation
      jumps back to the start once locally, but I haven't
      observed this behavior in production builds.
      */
    // Force animation to start only once
    if (progressRef.current) {
      progressRef.current.style.animation = "none";
      progressRef.current.offsetHeight; // Trigger reflow
      progressRef.current.style.animation = "";
    }
  }, []);

  return (
    <div className="w-full flex flex-col justify-center items-center mt-20 gap-4">
      <span className="text-muted-foreground text-sm">
        Setting up the database...
      </span>
      <div className="w-[60%] max-w-md">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-primary progress-animated"
          />
        </div>
      </div>
    </div>
  );
}
