import { describe, expect, test } from "vitest";
import { moveTask } from "@/utils/moveTask";

describe("moveTask", () => {
  test("moves item forward", () => {
    expect(moveTask(["3", "2", "6", "7", "5"], 0, 3)).toEqual([
      "2",
      "6",
      "3",
      "7",
      "5",
    ]);
  });

  test("moves item backward", () => {
    expect(moveTask(["3", "2", "6", "7", "5"], 3, 0)).toEqual([
      "7",
      "3",
      "2",
      "6",
      "5",
    ]);
  });

  test("moves item to same index", () => {
    expect(moveTask(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  test("oldIndex out of bounds (negative)", () => {
    expect(moveTask(["a", "b", "c"], -1, 1)).toEqual(["a", "b", "c"]);
  });

  test("oldIndex out of bounds (too large)", () => {
    expect(moveTask(["a", "b", "c"], 3, 1)).toEqual(["a", "b", "c"]);
  });

  test("empty array", () => {
    expect(moveTask([], 0, 1)).toEqual([]);
  });

  test("single element array", () => {
    expect(moveTask(["a"], 0, 0)).toEqual(["a"]);
  });
});
