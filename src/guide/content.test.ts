import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";

import { createSeedData } from "@/fixtures";
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
});
