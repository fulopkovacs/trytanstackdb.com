import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { setNetworkConfig } from "@/api/network-config";
import { isSectionDone } from "@/components/guide/guide-store";
import { foldersCollection } from "@/db/collections";
import { renameFolder } from "@/db/mutations";
import { routeTree } from "@/routeTree.gen";

import { rollbackNotice, startAppNotifications } from "./app-notifications";

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  await foldersCollection.preload();
});

let stop: (() => void) | undefined;
afterEach(() => stop?.());

describe("app notifications", () => {
  it("are mounted by the root route, which every page shares", () => {
    // The workspace and the deep dives are both children of the root route.
    expect(routeTree.options.component).toBeDefined();
    const router = createRouter({
      routeTree,
      history: createMemoryHistory(),
      context: { queryClient: undefined as never },
    });
    for (const id of [
      "/_workspace",
      "/deep-dives/neon-realtime",
      "/deep-dives/query-driven-sync",
    ] as const) {
      expect(router.routesById[id].parentRoute, id).toBe(routeTree);
    }
  });

  it("report a rejected change and tick off Rollbacks, wherever the reader is", async () => {
    setNetworkConfig({ latencyMs: 30 });
    const notify = vi.fn();
    stop = startAppNotifications(notify);

    // The reader leaves the Notes app while the rename is in flight; nothing
    // here depends on the workspace being mounted.
    const tx = renameFolder("work", "Personal");
    expect(foldersCollection.get("work")?.name).toBe("Personal");
    await tx.when("settled").catch(() => {});

    expect(foldersCollection.get("work")?.name).toBe("Work");
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Couldn't rename the folder",
        description: "There's already a folder named “Personal”. The change was undone.",
      }),
    );
    expect(isSectionDone("rollbacks")).toBe(true);
  });

  it("only speak up for rollbacks", () => {
    expect(
      rollbackNotice({ type: "folder.renamed", folderId: "work", name: "X", status: "confirmed" }),
    ).toBeNull();
  });
});
