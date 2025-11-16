import { DatabaseZap, TimerIcon } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getExpiryDate } from "@/server/functions/getExpiryDate";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

function ExpiryCounter() {
  const getExpiryTimeFn = useServerFn(getExpiryDate);

  const getExpiryTimeQ = useQuery({
    queryKey: ["expiryTime"],
    queryFn: () => getExpiryTimeFn(),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // refetchInterval: 1000,
  });

  return (
    <div className="text-sm text-muted-foreground font-mono flex items-center gap-1">
      {getExpiryTimeQ.data && (
        <>
          {" "}
          <TimerIcon className="h-4 w-4" />
          <div>
            Time until this db is destroyed:{" "}
            <TimeLeft expiryTimestamp={getExpiryTimeQ.data} />
          </div>
        </>
      )}
    </div>
  );
}

function TimeLeft({ expiryTimestamp }: { expiryTimestamp: number }) {
  const calculateTimeLeft = useCallback(
    (now: number) => {
      const diff = Math.max(expiryTimestamp - now, 0);
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return { days, hours, minutes, seconds };
    },
    [expiryTimestamp],
  );

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(Date.now()));

  useEffect(() => {
    if (expiryTimestamp <= Date.now()) return;
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTimestamp, calculateTimeLeft]);

  if (expiryTimestamp <= Date.now()) {
    return <span>Expired</span>;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <span>
      {days > 0 && `${days}d `}
      {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
}

// Usage example:
// <Timer expiryTimestamp={getExpiryTimeQ.data} />

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0">
      <a
        target="_blank"
        href="https://tanstack.com/db/latest/docs/overview"
        className="flex items-center gap-2 text-sm cursor-pointer"
        rel="noopener"
      >
        <DatabaseZap className="h-4 text-orange-500" />
        <div>
          <span className="bg-linear-to-r bg-clip-text from-orange-500 to-orange-700 text-transparent">
            TanTanck DB Demo{" "}
          </span>
          <span className="text-muted-foreground">(unofficial!)</span>{" "}
        </div>
      </a>
      <div className="flex items-center gap-4 ml-auto">
        <ClientOnly>
          <ExpiryCounter />
        </ClientOnly>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
