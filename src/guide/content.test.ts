import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";

import { createSeedData } from "@/fixtures";
import { APP_SCREENS } from "@/lib/app-state";
import { resolveFolderView } from "@/lib/notes/folder-views";
import { routeTree } from "@/routeTree.gen";

import { GUIDE_SECTIONS } from "./content";

const router = createRouter({
  routeTree,
  history: createMemoryHistory(),
  context: { queryClient: undefined as never },
});

describe("guide sections", () => {
  it("have unique ids", () => {
    const ids = GUIDE_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("have short chip labels", () => {
    for (const section of GUIDE_SECTIONS) expect(section.shortTitle.length).toBeLessThanOrEqual(20);
  });

  it("deep-link the hands-on ones into the app", () => {
    const targets = Object.fromEntries(
      GUIDE_SECTIONS.filter((section) => section.tryIt).map((section) => [
        section.id,
        router.buildLocation(section.tryIt!).pathname,
      ]),
    );
    expect(targets).toEqual({
      introduction: "/",
      collections: "/",
      "live-queries": "/folders/all",
      "optimistic-updates": "/folders/work",
      rollbacks: "/",
      aggregations: "/analytics",
    });
  });

  it("only point at screens that exist", () => {
    const { folders } = createSeedData();
    for (const section of GUIDE_SECTIONS) {
      if (!section.tryIt) continue;
      const { pathname } = router.buildLocation(section.tryIt);
      const matches = router.matchRoutes(pathname);
      const leaf = matches.at(-1);
      if (!leaf) throw new Error(`${section.id} → ${pathname} matches no route`);
      expect(leaf.routeId, `${section.id} → ${pathname}`).not.toBe("__root__");
      const { folderId } = leaf.params as { folderId?: string };
      if (folderId) {
        expect(resolveFolderView(folderId, folders), `${section.id} → ${pathname}`).toBeDefined();
      }
    }
  });

  it("map to app states on the Notes app's screens", () => {
    const { folders, notes } = createSeedData();
    const note = notes.find((note) => note.deletedAt === null)!;
    for (const section of GUIDE_SECTIONS) {
      for (const state of section.appStates) {
        const label = `${section.id} → ${JSON.stringify(state)}`;
        if (!state.screen) continue;
        expect(APP_SCREENS, label).toContain(state.screen);
        const params = { folderId: note.folderId, noteId: note.id, ...state.params };
        const { pathname } = router.buildLocation({ to: state.screen, params } as never);
        const leaf = router.matchRoutes(pathname).at(-1);
        expect(leaf?.routeId, label).toMatch(/^\/_workspace\//);
        if (state.params?.folderId) {
          expect(resolveFolderView(state.params.folderId, folders), label).toBeDefined();
        }
      }
    }
  });

  it("give every hands-on section at least one app state", () => {
    for (const section of GUIDE_SECTIONS) {
      if (section.tryIt) expect(section.appStates.length, section.id).toBeGreaterThan(0);
    }
  });
});

describe("app screens", () => {
  it("are all Notes app routes", () => {
    for (const screen of APP_SCREENS) {
      const { pathname } = router.buildLocation({
        to: screen,
        params: { folderId: "work", noteId: "note-01" },
      } as never);
      expect(router.matchRoutes(pathname).at(-1)?.routeId, screen).toMatch(/^\/_workspace\//);
    }
  });
});
