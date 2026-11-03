import { describe, expect, it } from "vite-plus/test";

import { LATENCY_PRESETS, formatLatency } from "./latency";

describe("formatLatency", () => {
  it("formats every preset", () => {
    expect(LATENCY_PRESETS.map(formatLatency)).toEqual(["0 ms", "500 ms", "2 s", "5 s"]);
  });

  it("keeps fractional seconds", () => {
    expect(formatLatency(1500)).toBe("1.5 s");
  });
});
