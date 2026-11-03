import { describe, expect, it } from "vite-plus/test";

import { anchorAt, scrollTopForAnchor } from "./scroll-anchor";
import type { AnchorBox, ScrollAnchor } from "./scroll-anchor";

const boxes: AnchorBox[] = [
  { id: "intro", top: -300, bottom: 100 },
  { id: "collections", top: 120, bottom: 600 },
  { id: "live-queries", top: 600, bottom: 900 },
];

describe("anchorAt", () => {
  it("finds the anchor that spans the line", () => {
    expect(anchorAt(boxes, 0)?.id).toBe("intro");
    expect(anchorAt(boxes, 300)?.id).toBe("collections");
    expect(anchorAt(boxes, 600)?.id).toBe("live-queries");
  });

  it("keeps the anchor above when the line falls in a gap", () => {
    expect(anchorAt(boxes, 110)?.id).toBe("intro");
  });

  it("returns nothing above the first anchor", () => {
    expect(anchorAt(boxes, -301)).toBeUndefined();
    expect(anchorAt([], 0)).toBeUndefined();
  });
});

describe("scrollTopForAnchor", () => {
  const saved: ScrollAnchor = { scrollTop: 1000, anchorId: "collections", anchorTop: -40 };

  it("returns the same position when nothing moved", () => {
    expect(
      scrollTopForAnchor({
        saved,
        currentScrollTop: 1000,
        currentAnchorTop: -40,
        maxScrollTop: 5000,
      }),
    ).toBe(1000);
  });

  it("follows the anchor when content above it grew", () => {
    // A 24px "You did it" row appeared above the anchor.
    expect(
      scrollTopForAnchor({
        saved,
        currentScrollTop: 1000,
        currentAnchorTop: -16,
        maxScrollTop: 5000,
      }),
    ).toBe(1024);
  });

  it("works when the view was scrolled away in the meantime", () => {
    expect(
      scrollTopForAnchor({ saved, currentScrollTop: 0, currentAnchorTop: 960, maxScrollTop: 5000 }),
    ).toBe(1000);
  });

  it("falls back to the raw position when the anchor is gone", () => {
    expect(
      scrollTopForAnchor({
        saved,
        currentScrollTop: 0,
        currentAnchorTop: undefined,
        maxScrollTop: 5000,
      }),
    ).toBe(1000);
  });

  it("clamps to the scroll range", () => {
    expect(
      scrollTopForAnchor({ saved, currentScrollTop: 0, currentAnchorTop: 960, maxScrollTop: 700 }),
    ).toBe(700);
    expect(
      scrollTopForAnchor({
        saved: { scrollTop: 0, anchorId: null, anchorTop: 0 },
        currentScrollTop: 50,
        currentAnchorTop: undefined,
        maxScrollTop: -10,
      }),
    ).toBe(0);
  });
});
