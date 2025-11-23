import { ClientOnly } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { client } from "@/db";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

/** Minimum time to show the loading state to avoid flickering */
const MIN_DB_LOADING_TIME = 500;

function DBConnectionStatusIndicator({
  setIsConnected,
}: {
  setIsConnected: (connected: boolean) => void;
}) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkConnection = async () => {
      if (client.ready) {
        setIsConnected(true);
      } else {
        await client.waitReady;
        setIsConnected(true);
      }
    };
    timeoutId = setTimeout(checkConnection, MIN_DB_LOADING_TIME);
    return () => clearTimeout(timeoutId);
  }, [setIsConnected]);

  return null;
}

export function ConfigureDB() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div>
      <ClientOnly>
        <DBConnectionStatusIndicator setIsConnected={setIsConnected} />
      </ClientOnly>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isConnected ? "connected" : "connecting"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Badge className="bg-neutral-100 text-black" variant={"secondary"}>
            <div
              className={cn(
                "grow-0 h-2 w-2 rounded-full",
                isConnected ? "bg-green-300" : "animate-pulse bg-yellow-400",
              )}
            />
            {isConnected ? "Connected" : "Connecting to db..."}
          </Badge>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
