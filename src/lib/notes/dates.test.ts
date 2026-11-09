import { describe, expect, test } from "vite-plus/test";

import { dateGroupLabel, formatListDate, groupByDate } from "./dates";

const now = new Date(2026, 10, 3, 20, 40);
const at = (month: number, day: number, hour = 12, year = 2026) => new Date(year, month, day, hour);

describe("dateGroupLabel", () => {
  test.each([
    [at(10, 3, 9), "Today"],
    [at(10, 2), "Yesterday"],
    [at(9, 29), "Previous 7 Days"],
    [at(9, 10), "Previous 30 Days"],
    [at(6, 1), "July"],
    [at(4, 1, 12, 2025), "2025"],
  ])("%s → %s", (date, label) => {
    expect(dateGroupLabel(date, now)).toBe(label);
  });
});

test("formatListDate", () => {
  expect(formatListDate(at(10, 3, 9), now)).toBe("09:00");
  expect(formatListDate(at(10, 2), now)).toBe("Yesterday");
  expect(formatListDate(at(9, 31), now)).toBe("Saturday");
  expect(formatListDate(at(8, 12), now)).toBe("12/09/2026");
});

test("groupByDate keeps consecutive items together", () => {
  const groups = groupByDate([at(10, 3), at(10, 3, 8), at(10, 2), at(9, 1)], (d) => d, now);
  expect(groups.map((group) => [group.label, group.items.length])).toEqual([
    ["Today", 2],
    ["Yesterday", 1],
    ["October", 1],
  ]);
});
