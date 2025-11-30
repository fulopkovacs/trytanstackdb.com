import { createIsomorphicFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { client } from "@/db";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/** Minimum time to show the loading state to avoid flickering */
const MIN_DB_LOADING_TIME = 1_000;

const checkConnection = createIsomorphicFn().client(
  async (cb: (state: boolean) => void) => {
    if (client.ready) {
      cb(true);
    } else {
      await client.waitReady;
      cb(true);
    }
  },
);

export function ConfigureDB() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    timeoutId = setTimeout(
      () => checkConnection(setIsConnected),
      MIN_DB_LOADING_TIME,
    );
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Tooltip>
      <div>
        <AnimatePresence mode="wait" initial={false}>
          <TooltipTrigger>
            <motion.div
              key={isConnected ? "connected" : "connecting"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Badge className="gap-2" variant={"secondary"}>
                <div
                  className={cn(
                    "grow-0 h-2 w-2 rounded-full",
                    isConnected
                      ? "bg-green-300"
                      : "animate-pulse bg-yellow-400",
                  )}
                />
                <span className="hidden lg:inline">
                  {isConnected ? "Connected to the db" : "Connecting to db..."}
                </span>
                <span className="inline lg:hidden">
                  {isConnected ? "Connected" : "Connecting"}
                </span>
              </Badge>
            </motion.div>
          </TooltipTrigger>
        </AnimatePresence>
      </div>
      <TooltipContent>
        This demo app runs a PGlite (Postgres in WASM) db instance locally.
      </TooltipContent>
    </Tooltip>
  );
}
