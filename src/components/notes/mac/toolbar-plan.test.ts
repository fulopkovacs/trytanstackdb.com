import { describe, expect, test } from "vite-plus/test";

import { planToolbar, toolbarWidth } from "./toolbar-plan";

describe("planToolbar", () => {
  test("shows everything and a full search field when there's room", () => {
    const plan = planToolbar(1000);
    expect(plan.overflow).toEqual([]);
    expect(plan.searchField).toBe(true);
  });

  test("shrinks search to an icon before hiding any item", () => {
    const everything = planToolbar(1000).visible;
    const justFits = toolbarWidth(everything, { searchField: false, overflowButton: false });
    const plan = planToolbar(justFits);
    expect(plan.searchField).toBe(false);
    expect(plan.overflow).toEqual([]);
  });

  test("moves the trailing items into the overflow menu first", () => {
    const plan = planToolbar(420);
    expect(plan.overflow).toEqual(expect.arrayContaining(["share", "more"]));
    expect(plan.visible.has("format")).toBe(true);
    expect(plan.visible.has("checklist")).toBe(true);
  });

  test("keeps overflow in toolbar order", () => {
    const plan = planToolbar(260);
    const order = [
      "format",
      "checklist",
      "table",
      "attachment",
      "markup",
      "link",
      "collaborate",
      "share",
      "more",
    ];
    expect(plan.overflow).toEqual(order.filter((id) => plan.overflow.includes(id as never)));
  });

  test("the plan always fits, down to a very narrow editor", () => {
    for (let width = 200; width <= 1000; width += 10) {
      const plan = planToolbar(width);
      const needed = toolbarWidth(plan.visible, {
        searchField: plan.searchField,
        overflowButton: plan.overflow.length > 0,
      });
      if (plan.visible.size > 0) expect(needed).toBeLessThanOrEqual(width);
    }
  });
});
