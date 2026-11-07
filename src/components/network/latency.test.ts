import { describe, expect, it } from "vite-plus/test";

import { LATENCY_PRESETS, formatDuration, formatLatency } from "./latency";

describe("formatLatency", () => {
  it("formats every preset", () => {
    expect(LATENCY_PRESETS.map(formatLatency)).toEqual(["0 ms", "500 ms", "2 s", "5 s"]);
  });

  it("keeps fractional seconds", () => {
    expect(formatLatency(1500)).toBe("1.5 s");
  });
});

describe("formatDuration", () => {
  it("shows milliseconds under a second, then seconds with one decimal", () => {
    expect(formatDuration(0)).toBe("0 ms");
    expect(formatDuration(502.4)).toBe("502 ms");
    expect(formatDuration(2013)).toBe("2.0 s");
    expect(formatDuration(5049)).toBe("5.0 s");
  });
});
