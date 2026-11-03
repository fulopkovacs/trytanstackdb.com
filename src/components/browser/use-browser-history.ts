import { useCanGoBack, useRouter } from "@tanstack/react-router";

import { useHistorySnapshot } from "@/lib/history-tracker";

/** Back/forward state for the fake browser, driven by the router's real history. */
export function useBrowserHistory() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const { index, lastIndex } = useHistorySnapshot();

  return {
    canGoBack,
    canGoForward: index < lastIndex,
    back: () => router.history.back(),
    forward: () => router.history.forward(),
    reload: () => router.invalidate(),
  };
}
