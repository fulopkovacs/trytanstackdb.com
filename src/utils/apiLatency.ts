import { z } from "zod";

export const API_LATENCY_LOCALSTORAGE_KEY = "__TRYTANSTACKDB_API_DELAY_MS__";

export const apiLatencyInMsSchema = z
  .enum(["0", "1000", "2000", "5000"])
  .transform((t) => parseInt(t, 10))
  .default(1_000)
  .catch(1_000);

export type ApiLatency = z.infer<typeof apiLatencyInMsSchema>;

export type ApiLatencyOption = {
  label: string;
  value: ApiLatency;
  color: string;
};

export const apiLatencyOptions: ApiLatencyOption[] = [
  { label: "No latency", value: 0, color: "green" },
  { label: "1s", value: 1_000, color: "lime" },
  { label: "2s", value: 2_000, color: "orange" },
  { label: "5s", value: 5_000, color: "red" },
];
