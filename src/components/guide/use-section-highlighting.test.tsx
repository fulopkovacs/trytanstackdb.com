// @vitest-environment happy-dom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  linkOptions,
} from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import {
  useCloseAppSheet,
  useIsAppSheetOpen,
  useOpenAppSheet,
} from "@/components/app-sheet/app-sheet-store";
import { setInspectorOpen } from "@/components/network/inspector-store";
import { reportAction } from "@/lib/app-actions";
import { createSheetAwareHistory, setRecordSheetState } from "@/lib/sheet-aware-history";

import { getActiveSection, setActiveSection } from "./guide-store";
import { useWorkspaceSectionHighlighting } from "./use-section-highlighting";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** What the harness exposes: the sheet's real open/close, and whether it's open. */
let sheet: {
  open: (sectionId: string, target: LinkOptions) => void;
  close: () => void;
  isOpen: boolean;
};

function Harness({ isSplit }: { isSplit: boolean }) {
  useWorkspaceSectionHighlighting(isSplit);
  sheet = { open: useOpenAppSheet(), close: useCloseAppSheet(), isOpen: useIsAppSheetOpen() };
  return <Outlet />;
}

/** A stand-in route tree with the app screens these tests visit. */
function renderWorkspace({ isSplit }: { isSplit: boolean }) {
  const rootRoute = createRootRoute({ component: () => <Harness isSplit={isSplit} /> });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => null }),
    createRoute({ getParentRoute: () => rootRoute, path: "/analytics", component: () => null }),
    createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: () => null }),
  ]);
  const history = createSheetAwareHistory(createMemoryHistory({ initialEntries: ["/"] }));
  const router = createRouter({ routeTree, history });
  return { router, history };
}

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  setActiveSection(null);
  setInspectorOpen(false);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  setRecordSheetState(false);
});

/** Waits for the router to finish navigating (some history moves resolve a tick later). */
async function untilIdle(router: { state: { status: string } }) {
  for (let tick = 0; tick < 50; tick++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (router.state.status === "idle" && tick > 1) return;
  }
  throw new Error("The router didn't settle");
}

/** Runs `step` and lets the router settle (history.go is asynchronous). */
async function settle(router: ReturnType<typeof renderWorkspace>["router"], step: () => unknown) {
  await act(async () => {
    await step();
    await untilIdle(router);
  });
}

describe("highlighting on phones (the app in a sheet)", () => {
  async function mount() {
    setRecordSheetState(true);
    const workspace = renderWorkspace({ isSplit: false });
    await act(async () => {
      root.render(<RouterProvider router={workspace.router} />);
      await untilIdle(workspace.router);
    });
    return workspace;
  }

  it("keeps the highlight when the sheet closes, by Close, Back or Forward", async () => {
    const { router, history } = await mount();
    // The guide on its own (sheet closed at "/") doesn't light anything up.
    expect(getActiveSection()).toBeNull();

    // Try it, from Aggregations.
    await settle(router, () => sheet.open("aggregations", linkOptions({ to: "/analytics" })));
    expect(sheet.isOpen).toBe(true);
    expect(getActiveSection()).toBe("aggregations");

    // Close goes back to the entry before the sheet opened ("/").
    await settle(router, () => sheet.close());
    expect(sheet.isOpen).toBe(false);
    expect(router.state.location.pathname).toBe("/");
    expect(getActiveSection()).toBe("aggregations");

    // Forward opens the sheet on Analytics again; Back closes it again.
    await settle(router, () => history.forward());
    expect(sheet.isOpen).toBe(true);
    expect(getActiveSection()).toBe("aggregations");
    await settle(router, () => history.back());
    expect(sheet.isOpen).toBe(false);
    expect(getActiveSection()).toBe("aggregations");
  });

  it("still follows the app while the sheet is open", async () => {
    const { router } = await mount();
    await settle(router, () => sheet.open("aggregations", linkOptions({ to: "/analytics" })));
    expect(getActiveSection()).toBe("aggregations");
    // Back to Folders inside the sheet: that's the reader using the app.
    await settle(router, () => router.navigate({ to: "/" }));
    expect(sheet.isOpen).toBe(true);
    expect(getActiveSection()).toBe("introduction");
  });

  it("keeps an action's highlight when the Network view closes with the sheet", async () => {
    const { router } = await mount();
    await settle(router, () => sheet.open("introduction", linkOptions({ to: "/" })));
    expect(getActiveSection()).toBe("introduction");
    await settle(router, () => reportAction({ type: "network.fail-next-set", failNext: true }));
    expect(getActiveSection()).toBe("rollbacks");
    await settle(router, () => sheet.close());
    expect(getActiveSection()).toBe("rollbacks");
  });
});

describe("highlighting on wide screens (the app beside the guide)", () => {
  it("follows navigation, and closing the inspector doesn't move the highlight", async () => {
    const { router } = renderWorkspace({ isSplit: true });
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await untilIdle(router);
    });
    expect(getActiveSection()).toBe("introduction");
    await settle(router, () => router.navigate({ to: "/analytics" }));
    expect(getActiveSection()).toBe("aggregations");
    await settle(router, () => router.navigate({ to: "/" }));
    expect(getActiveSection()).toBe("introduction");
    await settle(router, () => setInspectorOpen(true));
    expect(getActiveSection()).toBe("sync");
    // Closing a panel isn't news: Folders still matches Intro, but the highlight stays.
    await settle(router, () => setInspectorOpen(false));
    expect(getActiveSection()).toBe("sync");
  });
});
