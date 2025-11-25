import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  setupPGlite,
  setupServiceWorkerHttpsProxy,
} from "@/client/pgliteHelpers";

export const Route = createFileRoute("/_tutorial/_db")({
  // the database is local to the browser, so no SSR
  ssr: false,
  beforeLoad: async () => {
    // we don't need this to run
    await setupServiceWorkerHttpsProxy();
    await setupPGlite();
  },
  component: RouteComponent,
});

function RouteComponent() {
  // Setup the API routes to handle requests
  // useSetupApiRoutes();

  return <Outlet />;
}
