import type { LinkOptions } from "@tanstack/react-router";

/**
 * Parts of the app the guide can point at ("Show me"). Each is marked in the
 * app with `data-spotlight="<target>"`, in both the macOS and the iPhone
 * layout.
 */
export const SPOTLIGHT_TARGETS = {
  "folder-counts": { label: "Folder counts", hint: "They're next to each folder in the app." },
  "note-list": { label: "Note list", hint: "Open a folder in the app to see it." },
  editor: { label: "Editor", hint: "There are no notes to open. Create one in the app first." },
  "network-controls": {
    label: "Network controls",
    hint: "They're in the browser toolbar, or under Network on a phone.",
  },
  "request-inspector": {
    label: "Request inspector",
    hint: "Open it with Requests in the browser toolbar, or under Network on a phone.",
  },
  analytics: { label: "Analytics", hint: "Open Analytics at the bottom of the folder list." },
} as const satisfies Record<string, { label: string; hint: string }>;

export type SpotlightTarget = keyof typeof SPOTLIGHT_TARGETS;

/** The network targets live next to the app (toolbar, drawer, the sheet's Network view). */
export function isNetworkTarget(target: SpotlightTarget): boolean {
  return target === "network-controls" || target === "request-inspector";
}

/** The folder the app is in (All iCloud outside a folder). */
export function folderIdFromPath(pathname: string): string {
  return /^\/folders\/([^/]+)/.exec(pathname)?.[1] ?? "all";
}

/**
 * Where to take the app so `target` is on screen, when it isn't already:
 * the folder you're in (or All iCloud) for the list, a note for the editor
 * (`noteToOpen`: the caller picks it), and so on. `null`: it's not about the
 * route, or there's nowhere to go (no notes at all).
 */
export function routeForTarget(
  target: SpotlightTarget,
  pathname: string,
  noteToOpen?: { folderId: string; noteId: string },
): LinkOptions | null {
  switch (target) {
    case "folder-counts":
      return { to: "/" };
    case "note-list":
      return { to: "/folders/$folderId", params: { folderId: folderIdFromPath(pathname) } };
    case "editor":
      return noteToOpen ? { to: "/folders/$folderId/notes/$noteId", params: noteToOpen } : null;
    case "analytics":
      return { to: "/analytics" };
    case "network-controls":
    case "request-inspector":
      return null;
  }
}

/** The element for `target` that's showing, if any (layouts can render a hidden copy). */
export function findSpotlightElement(target: SpotlightTarget): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-spotlight="${target}"]`);
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}
