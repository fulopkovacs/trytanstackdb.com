import type { FileRoutesByTo } from "@/routeTree.gen";

import type { AppActionMatcher } from "./app-actions";

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

/**
 * A state of the Notes app that a guide section is about: a screen, what
 * the reader just did there, or both. Phase 4 highlights the section whose
 * states match the app; nothing reads these yet.
 */
export interface AppState {
  /** The screen. Omitted: any screen. */
  screen?: AppScreen;
  /** Narrows the screen to some route params, e.g. `{ folderId: "all" }`. */
  params?: { folderId?: string; noteId?: string };
  /** The reader's last action (see `app-actions.ts`). Omitted: any, or none. */
  lastAction?: AppActionMatcher;
}
