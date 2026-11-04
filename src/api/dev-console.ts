import { getNetworkConfig, setNetworkConfig } from "./network-config";
import { clearRequestLog, requestLogStore } from "./request-log";

/**
 * Dev only: the fake API's knobs on `window.__fakeApi`, until phase 4 puts
 * them in the browser toolbar.
 *
 *   __fakeApi.setNetworkConfig({ latencyMs: 2000 })
 *   __fakeApi.setNetworkConfig({ failNextRequest: true })
 *   console.table(__fakeApi.requests())
 *
 * For scripted browsers that can't run JS, the page URL can set them too,
 * once on load: `?latency=3000` (ms) and `?failNext=1`, also on deep links
 * like `/folders/work/notes/note-07?latency=3000`.
 */
export function exposeFakeApiOnWindow() {
  if (!import.meta.env.DEV) return;
  Object.assign(window, {
    __fakeApi: {
      getNetworkConfig,
      setNetworkConfig,
      requests: () => requestLogStore.get(),
      clearRequests: clearRequestLog,
    },
  });
}

/**
 * Applied when this module loads: before any route renders, so before the
 * app's first requests and before a redirect (`<Navigate replace>`) could
 * replace the URL without its query string.
 */
if (import.meta.env.DEV && typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const latency = Number(params.get("latency"));
  if (params.has("latency") && Number.isFinite(latency) && latency >= 0) {
    setNetworkConfig({ latencyMs: latency });
  }
  if (params.get("failNext") === "1") setNetworkConfig({ failNextRequest: true });
}
