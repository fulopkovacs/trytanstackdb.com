import { describe, expect, it } from "vite-plus/test";

import { isOnScreen } from "./app-screen";

describe("isOnScreen", () => {
  it("matches the screen itself", () => {
    expect(isOnScreen("/folders/work", "/folders/work")).toBe(true);
    expect(isOnScreen("/folders/work/", "/folders/work")).toBe(true);
  });

  it("matches screens pushed on top of it", () => {
    expect(isOnScreen("/folders/work/notes/n4", "/folders/work")).toBe(true);
  });

  it("doesn't match sibling screens that share a prefix", () => {
    expect(isOnScreen("/folders/workshop", "/folders/work")).toBe(false);
    expect(isOnScreen("/folders/personal", "/folders/work")).toBe(false);
  });

  it("only matches the root screen exactly", () => {
    expect(isOnScreen("/", "/")).toBe(true);
    expect(isOnScreen("/folders/work", "/")).toBe(false);
    expect(isOnScreen("/settings", "/")).toBe(false);
  });
});
