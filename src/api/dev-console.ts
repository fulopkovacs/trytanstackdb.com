import { getNetworkConfig, setNetworkConfig } from "./network-config";
import { clearRequestLog, requestLogStore } from "./request-log";

/**
 * Dev only: the fake API's knobs on `window.__fakeApi`, until phase 4 puts
 * them in the browser toolbar.
 *
 *   __fakeApi.setNetworkConfig({ latencyMs: 2000 })
 *   __fakeApi.setNetworkConfig({ failNextRequest: true })
 *   console.table(__fakeApi.requests())
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
