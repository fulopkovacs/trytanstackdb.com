// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { setNetworkConfig } from "@/api/network-config";
import { accountCollection, foldersCollection, notesCollection } from "@/db/collections";

import { AnalyticsCharts } from "./analytics-charts";
import { moduleUrlFrom } from "./lazy-charts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Whether loading the chart module fails, like a chunk that can't be fetched. */
const chartsImport = vi.hoisted(() => ({ fail: true }));

vi.mock("./charts", () => {
  if (chartsImport.fail) throw new Error("Failed to fetch dynamically imported module");
  return {
    FolderBarChart: ({ measure }: { measure: string }) => <svg data-chart={measure} />,
    DayBarChart: () => <svg data-chart="days" />,
  };
});

let root: Root;
let container: HTMLElement;

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  await Promise.all([
    foldersCollection.preload(),
    notesCollection.preload(),
    accountCollection.preload(),
  ]);
});

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  // Like the app's root error screen: an error no boundary catches takes the whole tree down.
  root = createRoot(container, { onUncaughtError: () => {} });
  // React logs errors caught by error boundaries; they're expected here.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

/**
 * Runs `step` in act() and lets lazy imports settle. act() rethrows render
 * errors no boundary caught; they're kept so the assertions can show what
 * the reader is left with.
 */
async function run(step: () => void | Promise<void>) {
  const errors: unknown[] = [];
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  for (const callback of [async () => step(), ...Array.from({ length: 10 }, () => tick)]) {
    try {
      await act(callback);
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}

describe("when the chart library fails to load", () => {
  it("keeps the page and its tables, says so in place of each chart, and retries", async () => {
    chartsImport.fail = true;
    const errors = await run(() =>
      root.render(
        <main>
          <p>The guide</p>
          <AnalyticsCharts variant="mac" />
        </main>,
      ),
    );

    // The rest of the page is still there, tables included.
    expect(container.textContent).toContain("The guide");
    expect(container.textContent).toContain("Notes per folder");
    expect(container.querySelectorAll("table")).toHaveLength(3);
    expect(container.querySelector("table")!.textContent).toContain("Work");
    // Each chart says it couldn't load, with a way to try again.
    expect(container.textContent).toContain("Couldn't load the chart.");
    const retries = [...container.querySelectorAll("button")].filter(
      (button) => button.textContent === "Try again",
    );
    expect(retries).toHaveLength(3);
    expect(container.querySelectorAll("svg[data-chart]")).toHaveLength(0);
    expect(errors).toEqual([]);

    // The network is back: one retry loads the chart module again for every chart.
    chartsImport.fail = false;
    expect(await run(() => retries[0]!.click())).toEqual([]);
    expect(container.textContent).not.toContain("Couldn't load the chart.");
    expect(
      [...container.querySelectorAll("svg[data-chart]")].map((svg) =>
        svg.getAttribute("data-chart"),
      ),
    ).toEqual(["notes", "words", "days"]);
    expect(container.querySelectorAll("table")).toHaveLength(3);
  });
});

describe("moduleUrlFrom", () => {
  it("finds the chunk a failed import named, to retry it under a new URL", () => {
    expect(
      moduleUrlFrom(
        new TypeError(
          "Failed to fetch dynamically imported module: https://trytanstackdb.com/assets/charts-DadIuOen.js",
        ),
      ),
    ).toBe("https://trytanstackdb.com/assets/charts-DadIuOen.js");
    expect(
      moduleUrlFrom(
        new TypeError(
          "error loading dynamically imported module: http://pop-os:3014/assets/charts-x.js",
        ),
      ),
    ).toBe("http://pop-os:3014/assets/charts-x.js");
    expect(moduleUrlFrom(new TypeError("Importing a module script failed."))).toBeNull();
  });
});
