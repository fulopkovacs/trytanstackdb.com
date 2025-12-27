import { GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  API_LATENCY_LOCALSTORAGE_KEY,
  type ApiLatency,
  type ApiLatencyOption,
  apiLatencyInMsSchema,
  apiLatencyOptions,
} from "@/utils/apiLatency";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

export function ApiLatencyConfigurator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLatency, setSelectedLatency] = useState<ApiLatency>(1_000);

  function handleSelectLatency(option: ApiLatencyOption) {
    localStorage.setItem(API_LATENCY_LOCALSTORAGE_KEY, option.value.toString());
    setSelectedLatency(option.value);
    setIsOpen(false);
  }

  useEffect(() => {
    // get the saved latency from localStorage
    const savedLatency = localStorage.getItem(API_LATENCY_LOCALSTORAGE_KEY);
    const latency = apiLatencyInMsSchema.parse(savedLatency);

    setSelectedLatency(latency);
  }, []);

  return (
    <HighlightWrapper highlightId="apiLatencyConfigurator">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <GlobeIcon
              className={cn(
                selectedLatency === 0
                  ? "text-green-500 dark:text-green-300"
                  : selectedLatency === 2000
                    ? "text-orange-400 dark:text-orange-300"
                    : selectedLatency === 5000
                      ? "text-destructive dark:text-destructive"
                      : "text-foreground",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit max-w-80 flex flex-col gap-2">
          <p className="text-sm text-foreground font-bold">
            Select the API latency you want to emulate.
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
          {apiLatencyOptions.map((option) => (
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
