import { describe, expect, it } from "vite-plus/test";

import { isSectionInView } from "@/components/guide/use-follow-active-section";
import { GUIDE_SECTIONS } from "@/guide/content";

import type { AppAction, AppActionEvent, AppActionStatus } from "./app-actions";
import {
  INITIAL_APP_SNAPSHOT,
  matchesAppState,
  nextAppSnapshot,
  screenFromRouteId,
  sectionForAppState,
} from "./app-state";
import type { AppScreen, AppSnapshot, AppStateInput } from "./app-state";

function event(action: AppAction, status: AppActionStatus = "applied"): AppActionEvent {
  return {
    ...action,
    status,
    ...(status === "rolled-back" ? { error: new Error("no") } : {}),
  };
}

const navigate = (screen: AppScreen | null, params: AppSnapshot["params"] = {}): AppStateInput => ({
  kind: "navigated",
  screen,
  params,
});
const act = (action: AppAction, status?: AppActionStatus): AppStateInput => ({
  kind: "action",
  event: event(action, status),
});

/** Plays inputs from a fresh app and returns the section the guide highlights after each one. */
function highlights(...inputs: AppStateInput[]): (string | null)[] {
  let snapshot = INITIAL_APP_SNAPSHOT;
  let active: string | null = null;
  return inputs.map((input) => {
    snapshot = nextAppSnapshot(snapshot, input);
    // The last highlight stays when nothing matches (see `useSectionHighlighting`).
    active = sectionForAppState(snapshot, GUIDE_SECTIONS) ?? active;
    return active;
  });
}

describe("screenFromRouteId", () => {
  it("maps the workspace's route ids to app screens", () => {
    expect(screenFromRouteId("/_workspace/")).toBe("/");
    expect(screenFromRouteId("/_workspace/folders/$folderId/")).toBe("/folders/$folderId");
    expect(screenFromRouteId("/_workspace/folders/$folderId/notes/$noteId")).toBe(
      "/folders/$folderId/notes/$noteId",
    );
    expect(screenFromRouteId("/_workspace/analytics")).toBe("/analytics");
    expect(screenFromRouteId("/deep-dives/query-driven-sync")).toBeNull();
  });
});

describe("matchesAppState", () => {
  const onNote = nextAppSnapshot(
    INITIAL_APP_SNAPSHOT,
    navigate("/folders/$folderId/notes/$noteId", { folderId: "work", noteId: "n1" }),
  );

  it("checks the screen, its params, the last action and the panel", () => {
    expect(matchesAppState({ screen: "/folders/$folderId/notes/$noteId" }, onNote)).toBe(true);
    expect(matchesAppState({ screen: "/analytics" }, onNote)).toBe(false);
    expect(matchesAppState({ params: { folderId: "work" } }, onNote)).toBe(true);
    expect(matchesAppState({ params: { folderId: "all" } }, onNote)).toBe(false);
    expect(matchesAppState({ lastAction: { type: "note.edited" } }, onNote)).toBe(false);
    expect(matchesAppState({ panel: "inspector" }, onNote)).toBe(false);
    expect(matchesAppState({}, onNote)).toBe(true);
  });

  it("only matches a rolled-back change when the state asks for one", () => {
    const rolledBack = nextAppSnapshot(
      onNote,
      act({ type: "note.edited", noteId: "n1" }, "rolled-back"),
    );
    expect(matchesAppState({ lastAction: { type: "note.edited" } }, rolledBack)).toBe(false);
    expect(matchesAppState({ lastAction: { status: "rolled-back" } }, rolledBack)).toBe(true);
  });
});

describe("nextAppSnapshot", () => {
  it("forgets the last action on navigation, unless it opened where we landed", () => {
    let snapshot = nextAppSnapshot(
      INITIAL_APP_SNAPSHOT,
      act({ type: "folder.opened", folderId: "work", smart: false }),
    );
    snapshot = nextAppSnapshot(snapshot, navigate("/folders/$folderId", { folderId: "work" }));
    expect(snapshot.lastAction?.type).toBe("folder.opened");
    snapshot = nextAppSnapshot(snapshot, navigate("/analytics"));
    expect(snapshot.lastAction).toBeNull();
  });

  it("ignores a confirmation once the reader has done something else", () => {
    let snapshot = nextAppSnapshot(
      INITIAL_APP_SNAPSHOT,
      act({ type: "note.pinned", noteId: "n1", pinned: true }),
    );
    snapshot = nextAppSnapshot(
      snapshot,
      act({ type: "note.moved", noteId: "n2", folderId: "work" }),
    );
    const after = nextAppSnapshot(
      snapshot,
      act({ type: "note.pinned", noteId: "n1", pinned: true }, "confirmed"),
    );
    expect(after).toBe(snapshot);
  });

  it("returns the same snapshot when nothing changed", () => {
    const snapshot = nextAppSnapshot(INITIAL_APP_SNAPSHOT, navigate("/"));
    expect(nextAppSnapshot(snapshot, navigate("/"))).toBe(snapshot);
    expect(nextAppSnapshot(snapshot, { kind: "panel", panel: null })).toBe(snapshot);
  });
});

describe("the guide's sections, from app state", () => {
  it("lights up the introduction on the Folders screen", () => {
    expect(highlights(navigate("/"))).toEqual(["introduction"]);
  });

  it("opening a folder or a note is about collections; a smart folder about live queries", () => {
    expect(
      highlights(
        act({ type: "folder.opened", folderId: "work", smart: false }),
        navigate("/folders/$folderId", { folderId: "work" }),
        act({ type: "folder.opened", folderId: "all", smart: true }),
        navigate("/folders/$folderId", { folderId: "all" }),
        act({ type: "note.opened", noteId: "n1" }),
        navigate("/folders/$folderId/notes/$noteId", { folderId: "all", noteId: "n1" }),
      ),
    ).toEqual([
      // The click comes first: no screen yet, so nothing matches.
      null,
      "collections",
      // Still on a folder's screen: opening a smart folder already matches.
      "live-queries",
      "live-queries",
      // Opening a note, before its screen shows: nothing matches, the highlight stays.
      "live-queries",
      "collections",
    ]);
  });

  it("editing stays on optimistic updates through its save, and a rejection is a rollback", () => {
    const note = { folderId: "work", noteId: "n1" };
    const edit = { type: "note.edited", noteId: "n1" } as const;
    expect(
      highlights(
        navigate("/folders/$folderId/notes/$noteId", note),
        act(edit),
        act(edit, "confirmed"),
        act(edit),
        act(edit, "rolled-back"),
      ),
    ).toEqual([
      null,
      "optimistic-updates",
      "optimistic-updates",
      "optimistic-updates",
      "rollbacks",
    ]);
  });

  it("a folder rename goes from optimistic updates to syncing once the server confirms it", () => {
    const rename = { type: "folder.renamed", folderId: "work", name: "Jobs" } as const;
    expect(highlights(navigate("/"), act(rename), act(rename, "confirmed"))).toEqual([
      "introduction",
      "optimistic-updates",
      "sync",
    ]);
  });

  it("a pin stays on live queries when it's confirmed", () => {
    const pin = { type: "note.pinned", noteId: "n1", pinned: true } as const;
    expect(
      highlights(
        navigate("/folders/$folderId", { folderId: "all" }),
        act(pin),
        act(pin, "confirmed"),
      ),
    ).toEqual([null, "live-queries", "live-queries"]);
  });

  it("the network controls point at optimistic updates and rollbacks", () => {
    expect(
      highlights(
        navigate("/"),
        act({ type: "network.latency-set", latencyMs: 5000 }),
        act({ type: "network.fail-next-set", failNext: true }),
      ),
    ).toEqual(["introduction", "optimistic-updates", "rollbacks"]);
  });

  it("opening the request inspector is about syncing, until the reader does something else", () => {
    const pin = { type: "note.pinned", noteId: "n1", pinned: false } as const;
    expect(
      highlights(
        navigate("/folders/$folderId", { folderId: "work" }),
        { kind: "panel", panel: "inspector" },
        act(pin),
      ),
    ).toEqual([null, "sync", "live-queries"]);
  });

  it("Analytics is about aggregations, and a save that lands later doesn't move the guide", () => {
    const edit = { type: "note.edited", noteId: "n1" } as const;
    expect(
      highlights(
        navigate("/folders/$folderId/notes/$noteId", { folderId: "work", noteId: "n1" }),
        act(edit),
        navigate("/analytics"),
        act(edit, "confirmed"),
      ),
    ).toEqual([null, "optimistic-updates", "aggregations", "aggregations"]);
  });
});

describe("isSectionInView", () => {
  const view = { top: 0, bottom: 800 };

  it("is in view when enough of it shows", () => {
    expect(isSectionInView({ top: 100, bottom: 600 }, view)).toBe(true);
    // Taller than the view, filling it.
    expect(isSectionInView({ top: -500, bottom: 1500 }, view)).toBe(true);
    // Only its last 300px show: 300 of a 1000px section is enough.
    expect(isSectionInView({ top: -700, bottom: 300 }, view)).toBe(true);
  });

  it("isn't when it's off screen or only peeking in", () => {
    expect(isSectionInView({ top: 900, bottom: 1400 }, view)).toBe(false);
    expect(isSectionInView({ top: 760, bottom: 1600 }, view)).toBe(false);
    expect(isSectionInView({ top: -1000, bottom: -10 }, view)).toBe(false);
  });
});
