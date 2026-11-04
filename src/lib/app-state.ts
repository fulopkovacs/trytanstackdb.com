import type { FileRoutesByTo } from "@/routeTree.gen";

import { matchesAppAction } from "./app-actions";
import type { AppActionEvent, AppActionMatcher } from "./app-actions";

/**
 * The Notes app's screens, as route paths. Checked against the route tree,
 * so a renamed route breaks the build.
 */
export const APP_SCREENS = [
  "/",
  "/folders/$folderId",
  "/folders/$folderId/notes/$noteId",
  "/settings",
  "/analytics",
] as const satisfies readonly (keyof FileRoutesByTo)[];

export type AppScreen = (typeof APP_SCREENS)[number];

/** Panels next to the app: the request inspector (a drawer on desktop, the sheet's Network view on phones). */
export type AppPanel = "inspector";

/**
 * A state of the Notes app that a guide section is about: a screen, what
 * the reader just did there, an open panel, or a mix. The guide highlights
 * the section whose states match the app (see `sectionForAppState`).
 */
export interface AppState {
  /** The screen. Omitted: any screen. */
  screen?: AppScreen;
  /** Narrows the screen to some route params, e.g. `{ folderId: "all" }`. */
  params?: { folderId?: string; noteId?: string };
  /**
   * The reader's last action (see `app-actions.ts`). Omitted: any, or none.
   * A matcher without a `status` only matches changes that weren't rolled
   * back: a rejected change is the Rollbacks section's business.
   */
  lastAction?: AppActionMatcher;
  /** An open panel. Omitted: any, or none. */
  panel?: AppPanel;
}

/**
 * What the app is doing right now, as the guide sees it. `changedAt` says
 * when each part last changed (a counter, not a clock), so the newest thing
 * the reader did wins over a panel that has just been left open.
 */
export interface AppSnapshot {
  screen: AppScreen | null;
  params: { folderId?: string; noteId?: string };
  lastAction: AppActionEvent | null;
  panel: AppPanel | null;
  changedAt: { screen: number; lastAction: number; panel: number };
  /** Counter for `changedAt`. */
  clock: number;
}

export const INITIAL_APP_SNAPSHOT: AppSnapshot = {
  screen: null,
  params: {},
  lastAction: null,
  panel: null,
  changedAt: { screen: 0, lastAction: 0, panel: 0 },
  clock: 0,
};

export type AppStateInput =
  | { kind: "navigated"; screen: AppScreen | null; params: AppSnapshot["params"] }
  | { kind: "action"; event: AppActionEvent }
  | { kind: "panel"; panel: AppPanel | null };

/**
 * Folds one thing that happened into the snapshot.
 *
 * - Navigating forgets the last action, unless the action was the reader
 *   opening the folder or note they've just landed on (those are reported on
 *   click, just before the route changes).
 * - A `confirmed` event only counts while its action is still the last one:
 *   a save that lands after the reader has moved on isn't news.
 * - A `rolled-back` event always counts: the change just disappeared.
 */
export function nextAppSnapshot(snapshot: AppSnapshot, input: AppStateInput): AppSnapshot {
  const clock = snapshot.clock + 1;
  switch (input.kind) {
    case "navigated": {
      if (input.screen === snapshot.screen && sameParams(input.params, snapshot.params)) {
        return snapshot;
      }
      const keepAction = snapshot.lastAction !== null && ledTo(snapshot.lastAction, input.params);
      return {
        ...snapshot,
        screen: input.screen,
        params: input.params,
        lastAction: keepAction ? snapshot.lastAction : null,
        changedAt: { ...snapshot.changedAt, screen: clock },
        clock,
      };
    }
    case "action": {
      const { event } = input;
      if (
        event.status === "confirmed" &&
        (snapshot.lastAction === null || actionKey(snapshot.lastAction) !== actionKey(event))
      ) {
        return snapshot;
      }
      return {
        ...snapshot,
        lastAction: event,
        changedAt: { ...snapshot.changedAt, lastAction: clock },
        clock,
      };
    }
    case "panel": {
      if (input.panel === snapshot.panel) return snapshot;
      return {
        ...snapshot,
        panel: input.panel,
        changedAt: { ...snapshot.changedAt, panel: clock },
        clock,
      };
    }
  }
}

/** Whether the app is in `state` right now. */
export function matchesAppState(state: AppState, snapshot: AppSnapshot): boolean {
  if (state.screen !== undefined && state.screen !== snapshot.screen) return false;
  for (const [key, value] of Object.entries(state.params ?? {})) {
    if (snapshot.params[key as keyof AppSnapshot["params"]] !== value) return false;
  }
  if (state.panel !== undefined && state.panel !== snapshot.panel) return false;
  if (state.lastAction !== undefined) {
    const event = snapshot.lastAction;
    if (event === null || !matchesAppAction(state.lastAction, event)) return false;
    if (event.status === "rolled-back" && state.lastAction.status === undefined) return false;
  }
  return true;
}

/**
 * The guide section that matches the app best, or `null` if none does.
 *
 * Among the sections with a matching state, the one about the newest change
 * wins (an action you just did beats a panel you opened a while ago), then
 * the more specific state (a screen and an action beat an action alone),
 * then the section that comes first in the guide.
 */
export function sectionForAppState(
  snapshot: AppSnapshot,
  sections: readonly { id: string; appStates: readonly AppState[] }[],
): string | null {
  let best: { id: string; recency: number; specificity: number } | null = null;
  for (const section of sections) {
    for (const state of section.appStates) {
      if (!matchesAppState(state, snapshot)) continue;
      const recency = stateRecency(state, snapshot);
      const specificity = stateSpecificity(state);
      if (
        best === null ||
        recency > best.recency ||
        (recency === best.recency && specificity > best.specificity)
      ) {
        best = { id: section.id, recency, specificity };
      }
    }
  }
  return best?.id ?? null;
}

/** When the newest part of the app this state looks at changed. */
function stateRecency(state: AppState, snapshot: AppSnapshot): number {
  return Math.max(
    state.screen !== undefined || state.params !== undefined ? snapshot.changedAt.screen : 0,
    state.lastAction !== undefined ? snapshot.changedAt.lastAction : 0,
    state.panel !== undefined ? snapshot.changedAt.panel : 0,
  );
}

/** How many things a state pins down. */
function stateSpecificity(state: AppState): number {
  return (
    (state.screen !== undefined ? 1 : 0) +
    Object.keys(state.params ?? {}).length +
    Object.keys(state.lastAction ?? {}).length +
    (state.panel !== undefined ? 1 : 0)
  );
}

function sameParams(a: AppSnapshot["params"], b: AppSnapshot["params"]): boolean {
  return a.folderId === b.folderId && a.noteId === b.noteId;
}

/** The action was opening the folder or note these route params point at. */
function ledTo(event: AppActionEvent, params: AppSnapshot["params"]): boolean {
  if (event.type === "folder.opened") return params.folderId === event.folderId;
  if (event.type === "note.opened") return params.noteId === event.noteId;
  return false;
}

/** The action without its outcome, so `applied` and `confirmed` of one change compare equal. */
function actionKey(event: AppActionEvent): string {
  const { status: _status, error: _error, ...action } = event;
  return JSON.stringify(action);
}

/** The app screen a route id stands for, e.g. `/_workspace/folders/$folderId/` → `/folders/$folderId`. */
export function screenFromRouteId(routeId: string): AppScreen | null {
  const path = routeId.replace(/^\/_workspace/, "").replace(/(.)\/$/, "$1") || "/";
  return (APP_SCREENS as readonly string[]).includes(path) ? (path as AppScreen) : null;
}
