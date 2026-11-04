import { createBrowserHistory } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";

import { withSheetState } from "./app-sheet-history";

let recordSheetState = false;

/**
 * Turned on while the small-screen layout (the one with the sheet) is
 * showing. The split layout has no sheet, so its entries record nothing and
 * a later switch to small screens treats them like direct loads.
 */
export function setRecordSheetState(enabled: boolean) {
  recordSheetState = enabled;
}

export function isRecordingSheetState(): boolean {
  return recordSheetState;
}

/**
 * Browser history where every new entry records whether the app sheet is
 * open, inheriting it from the current entry unless the navigation says
 * otherwise. Links inside the app don't need to know the sheet exists.
 * See `app-sheet-history.ts` for the whole contract. Tests pass a memory
 * history as `history`.
 */
export function createSheetAwareHistory(
  history: RouterHistory = createBrowserHistory(),
): RouterHistory {
  const { push, replace } = history;
  const withState = (state: object | undefined) =>
    recordSheetState ? withSheetState(history.location, state) : state;
  history.push = (path, state, navigateOpts) => push(path, withState(state), navigateOpts);
  history.replace = (path, state, navigateOpts) => replace(path, withState(state), navigateOpts);
  return history;
}
