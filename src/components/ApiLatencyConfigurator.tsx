import { GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { API_LATENCY_LOCALSTORAGE_KEY } from "@/client/pgliteHelpers";
import { cn } from "@/lib/utils";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

export const apiLatencyInMsSchema = z
  .enum(["0", "1000", "2000", "5000"])
  .transform((t) => parseInt(t, 10))
  .default(1_000)
  .catch(1_000);

type ApiLatency = z.infer<typeof apiLatencyInMsSchema>;

type ApiLatencyOption = {
  label: string;
  value: ApiLatency;
  color: string;
};

const apiLatencyOptions: ApiLatencyOption[] = [
  { label: "No latency", value: 0, color: "green" },
  { label: "1s", value: 1_000, color: "lime" },
  { label: "2s", value: 2_000, color: "orange" },
  { label: "5s", value: 5_000, color: "red" },
];

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
