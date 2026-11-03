/** Latency presets for the fake API, in milliseconds (wired up in phase 4). */
export const LATENCY_PRESETS = [0, 500, 2000, 5000] as const;

export type LatencyPreset = (typeof LATENCY_PRESETS)[number];

/** `0` → "0 ms", `500` → "500 ms", `2000` → "2 s". */
export function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${ms / 1000} s`;
}
