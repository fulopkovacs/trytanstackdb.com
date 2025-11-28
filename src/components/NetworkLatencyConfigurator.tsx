import { GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  NETWORK_LATENCY_LOCALSTORAGE_KEY,
  networkLatencyInMsSchema,
} from "@/client/pgliteHelpers";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";

type NetworkLatency = 0 | 1000 | 2000 | 5000;

type NetworkLatencyOption = {
  label: string;
  value: NetworkLatency;
  color: string;
};

const networkLatencyOptions: NetworkLatencyOption[] = [
  { label: "No latency", value: 0, color: "green" },
  { label: "1s", value: 1_000, color: "lime" },
  { label: "2s", value: 2_000, color: "orange" },
  { label: "5s", value: 5_000, color: "red" },
];

export function NetworkLatencyConfigurator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLatency, setSelectedLatency] = useState<NetworkLatency>(1_000);

  function handleSelectLatency(option: NetworkLatencyOption) {
    localStorage.setItem(
      NETWORK_LATENCY_LOCALSTORAGE_KEY,
      option.value.toString(),
    );
    setSelectedLatency(option.value);
    setIsOpen(false);
  }

  useEffect(() => {
    // get the saved latency from localStorage
    const savedLatency = localStorage.getItem(NETWORK_LATENCY_LOCALSTORAGE_KEY);
    const latency = networkLatencyInMsSchema.parse(savedLatency);

    setSelectedLatency(latency as NetworkLatency);
  }, []);

  return (
    <HighlightWrapper highlightId="networkLatencyCofigurator">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <GlobeIcon
              className={cn(
                selectedLatency === 0
                  ? "text-green-300"
                  : selectedLatency === 2000
                    ? "text-orange-300"
                    : selectedLatency === 5000
                      ? "text-destructive-foreground"
                      : "text-foreground",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit max-w-80 flex flex-col gap-2">
          <p className="text-sm text-foreground font-bold">
            Select the network latency you want to emulate.
          </p>
          <p className="text-xs text-muted-foreground">
            Note that requests won't show up in the Network tab of the DevTools
            until they are completed (no PENDING state).
          </p>
          <p className="text-xs text-muted-foreground">
            This is because currently they are handled locally by a service
            worker and this implementation comes with this limitation.
          </p>
          <Separator orientation="horizontal" />
          {networkLatencyOptions.map((option) => (
            <div key={option.value} className="">
              <Button
                key={option.value}
                variant={
                  selectedLatency === option.value ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => {
                  handleSelectLatency(option);
                }}
                className="w-full"
              >
                {option.label}
              </Button>
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </HighlightWrapper>
  );
}
