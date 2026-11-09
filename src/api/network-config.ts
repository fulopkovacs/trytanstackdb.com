import { createStore, useStore } from "@/lib/store";

/**
 * How the fake network behaves. The browser toolbar's latency and failure
 * controls (the app sheet's Network view on phones) write to this store; in
 * dev it's also on the console: `__fakeApi.setNetworkConfig({ latencyMs: 2000 })`.
 */
export interface NetworkConfig {
  /** How long every request takes, in milliseconds. */
  latencyMs: number;
  /** Fail the next request sent with a 500, then switch back off. Requests already in flight aren't affected. */
  failNextRequest: boolean;
  /** Share of requests (0 to 1) that fail at random. */
  failureRate: number;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  latencyMs: 500,
  failNextRequest: false,
  failureRate: 0,
};

export const networkConfigStore = createStore<NetworkConfig>(DEFAULT_NETWORK_CONFIG);

export function getNetworkConfig(): NetworkConfig {
  return networkConfigStore.get();
}

export function setNetworkConfig(changes: Partial<NetworkConfig>) {
  networkConfigStore.set((config) => ({ ...config, ...changes }));
}

export function useNetworkConfig(): NetworkConfig {
  return useStore(networkConfigStore);
}

/**
 * Decides whether a request should fail, and consumes "fail next request".
 * `random` is injectable for tests.
 */
export function takeInjectedFailure(random: () => number = Math.random): boolean {
  const { failNextRequest, failureRate } = getNetworkConfig();
  if (failNextRequest) {
    setNetworkConfig({ failNextRequest: false });
    return true;
  }
  return failureRate > 0 && random() < failureRate;
}
