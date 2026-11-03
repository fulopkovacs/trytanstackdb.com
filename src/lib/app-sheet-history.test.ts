import { describe, expect, it } from "vite-plus/test";

import {
  closeSheetAction,
  isSheetOpen,
  openSheetState,
  readSheetState,
  withSheetState,
} from "./app-sheet-history";

describe("isSheetOpen", () => {
  it("follows the entry's record", () => {
    expect(isSheetOpen({ appSheet: true }, "/")).toBe(true);
    expect(isSheetOpen({ appSheet: false }, "/folders/work")).toBe(false);
  });

  it("opens on app screens when the entry has no record (direct load)", () => {
    expect(isSheetOpen({ __TSR_index: 0 }, "/folders/work/notes/note-01")).toBe(true);
    expect(isSheetOpen(undefined, "/settings")).toBe(true);
    expect(isSheetOpen({}, "/")).toBe(false);
  });
});

describe("readSheetState", () => {
  it("ignores junk", () => {
    expect(readSheetState({ appSheet: "yes", appSheetOpenedAt: "2" })).toEqual({
      appSheet: undefined,
      appSheetOpenedAt: undefined,
    });
    expect(readSheetState(null)).toEqual({});
  });
});

describe("withSheetState", () => {
  const open = { state: { appSheet: true, appSheetOpenedAt: 3 }, pathname: "/folders/work" };
  const closed = { state: { appSheet: false }, pathname: "/folders/work" };

  it("keeps the sheet open for navigation inside the app", () => {
    expect(withSheetState(open, { __TSR_key: "k" })).toEqual({
      __TSR_key: "k",
      appSheet: true,
      appSheetOpenedAt: 3,
    });
  });

  it("makes an inherited record explicit, so the root screen stays open too", () => {
    const directLoad = { state: {}, pathname: "/folders/work" };
    expect(withSheetState(directLoad, {})).toEqual({ appSheet: true });
  });

  it("keeps it closed when it was closed", () => {
    expect(withSheetState(closed, {})).toEqual({ appSheet: false });
  });

  it("lets the navigation decide when it says so", () => {
    expect(withSheetState(open, { appSheet: false })).toEqual({ appSheet: false });
    expect(withSheetState(closed, openSheetState(5))).toEqual({
      appSheet: true,
      appSheetOpenedAt: 6,
    });
  });
});

describe("closeSheetAction", () => {
  it("goes back to the entry before the one that opened the sheet", () => {
    // Opened at index 4 (from 3), then two screens deeper.
    expect(closeSheetAction({ appSheet: true, appSheetOpenedAt: 4 }, 6)).toEqual({
      type: "go",
      delta: -3,
    });
    expect(closeSheetAction({ appSheet: true, appSheetOpenedAt: 4 }, 4)).toEqual({
      type: "go",
      delta: -1,
    });
  });

  it("replaces the entry when the sheet opened on a direct load", () => {
    expect(closeSheetAction({ appSheet: true }, 0)).toEqual({
      type: "replace",
      state: { appSheet: false, appSheetOpenedAt: undefined },
    });
  });

  it("doesn't trust an opener index that isn't behind us", () => {
    expect(closeSheetAction({ appSheet: true, appSheetOpenedAt: 9 }, 2).type).toBe("replace");
    expect(closeSheetAction({ appSheet: true, appSheetOpenedAt: 0 }, 2).type).toBe("replace");
  });
});
