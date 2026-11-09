/**
 * "Try it" opens the app on the screen a guide section is about. If the app is
 * already on that screen, or on a screen pushed on top of it (a note opened
 * from that folder), we leave it there, so the app picks up where the reader
 * left it.
 */
export function isOnScreen(pathname: string, screenPathname: string): boolean {
  const current = withoutTrailingSlash(pathname);
  const screen = withoutTrailingSlash(screenPathname);
  if (current === screen) return true;
  // Every path is "below" the root (Folders), so the root only matches itself.
  if (screen === "/") return false;
  return current.startsWith(`${screen}/`);
}

function withoutTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
