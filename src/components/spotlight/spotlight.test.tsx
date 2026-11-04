// @vitest-environment happy-dom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { NotesLayoutProvider, useNotesLayout } from "@/components/notes/notes-layout";

import { SpotlightOverlay, dismissSpotlight, startSpotlight, useShowSpotlight } from "./spotlight";
import type { SpotlightTarget } from "./spotlight-targets";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  dismissSpotlight();
  vi.useRealTimers();
});

describe("Show me, when the target is hidden", () => {
  let api: { show: (target: SpotlightTarget) => Promise<void>; toggleSidebar: () => void };

  /** The macOS sidebar (folder counts) inside the app's real layout provider. */
  function Sidebar() {
    const { sidebarVisible, toggleSidebar } = useNotesLayout();
    api = { show: useShowSpotlight(), toggleSidebar };
    return sidebarVisible ? <nav data-spotlight="folder-counts">Folders 3 4 6</nav> : null;
  }

  it("brings back a hidden sidebar to show the folder counts, without navigating", async () => {
    const rootRoute = createRootRoute({
      component: () => (
        <NotesLayoutProvider>
          <Sidebar />
          <Outlet />
        </NotesLayoutProvider>
      ),
    });
    const routeTree = rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => null }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/folders/$folderId",
        component: () => null,
      }),
    ]);
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/folders/work"] }),
    });
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const folderCounts = () => document.querySelector('[data-spotlight="folder-counts"]');
    expect(folderCounts()).not.toBeNull();

    act(() => api.toggleSidebar());
    expect(folderCounts()).toBeNull();

    await act(() => api.show("folder-counts"));
    expect(folderCounts()).not.toBeNull();
    expect(router.state.location.pathname).toBe("/folders/work");
  });
});

describe("the spotlight, when the target never shows up", () => {
  it("says what it couldn't show, instead of failing silently", async () => {
    vi.useFakeTimers();
    const onMissing = vi.fn();
    act(() => root.render(<SpotlightOverlay onMissing={onMissing} />));
    act(() => startSpotlight("editor"));
    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(onMissing).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(onMissing).toHaveBeenCalledWith("editor");
  });
});
