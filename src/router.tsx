import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { getContext } from "./integrations/tanstack-query/root-provider";
import { createSheetAwareHistory } from "./lib/sheet-aware-history";

export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    // On the server, TanStack Start supplies its own (memory) history.
    history: typeof window === "undefined" ? undefined : createSheetAwareHistory(),
    scrollRestoration: true,
    // Scroll containers inside the fake app start at the top on each new page
    // (back/forward still restores their position).
    scrollToTopSelectors: ["[data-page-scroll]"],
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
