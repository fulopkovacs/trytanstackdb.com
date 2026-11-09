import { describe, expect, it } from "vite-plus/test";

import { sheetOffset, shouldCloseOnRelease } from "./sheet-gesture";

describe("sheetOffset", () => {
  it("follows the finger downwards", () => {
    expect(sheetOffset(0)).toBe(0);
    expect(sheetOffset(180)).toBe(180);
  });

  it("resists upwards, and never moves more than a few pixels", () => {
    expect(sheetOffset(-30)).toBeLessThan(0);
    expect(sheetOffset(-30)).toBeGreaterThan(-30);
    expect(sheetOffset(-1000)).toBeGreaterThanOrEqual(-12);
  });
});

describe("shouldCloseOnRelease", () => {
  const sheetHeight = 800;

  it("closes when dragged past a quarter of the sheet", () => {
    expect(shouldCloseOnRelease({ offset: 200, velocity: 0, sheetHeight })).toBe(true);
    expect(shouldCloseOnRelease({ offset: 199, velocity: 0, sheetHeight })).toBe(false);
  });

  it("closes on a quick downward flick", () => {
    expect(shouldCloseOnRelease({ offset: 60, velocity: 0.9, sheetHeight })).toBe(true);
  });

  it("stays open for a flick upwards or a tiny twitch", () => {
    expect(shouldCloseOnRelease({ offset: 60, velocity: -0.9, sheetHeight })).toBe(false);
    expect(shouldCloseOnRelease({ offset: 8, velocity: 2, sheetHeight })).toBe(false);
  });
});
