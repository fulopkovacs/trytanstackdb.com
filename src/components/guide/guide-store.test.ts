import { describe, expect, it } from "vite-plus/test";

import { getDoneSections, isSectionDone, markSectionDone, markSectionNotDone } from "./guide-store";

describe("section progress", () => {
  it("marks sections done and undone", () => {
    expect(isSectionDone("optimistic-updates")).toBe(false);
    markSectionDone("optimistic-updates");
    expect(isSectionDone("optimistic-updates")).toBe(true);
    markSectionNotDone("optimistic-updates");
    expect(isSectionDone("optimistic-updates")).toBe(false);
  });

  it("keeps the same snapshot when nothing changes", () => {
    markSectionDone("rollbacks");
    const snapshot = getDoneSections();
    markSectionDone("rollbacks");
    markSectionNotDone("aggregations");
    expect(getDoneSections()).toBe(snapshot);

    markSectionDone("aggregations");
    expect(getDoneSections()).not.toBe(snapshot);
    expect([...getDoneSections()]).toEqual(["rollbacks", "aggregations"]);
  });
});
