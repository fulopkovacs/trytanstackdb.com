import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  setupPGlite,
  setupServiceWorkerHttpsProxy,
} from "@/client/pgliteHelpers";
import { FakeProgressIndicator } from "@/components/FakeProgressIndicator";

export const Route = createFileRoute("/_tutorial/_db")({
  // the database is local to the browser, so no SSR
  ssr: false,
  beforeLoad: async () => {
    // we don't need this to run
    await setupServiceWorkerHttpsProxy();
    await setupPGlite();
  },
  component: RouteComponent,
  pendingComponent: FakeProgressIndicator,
  // Show the pending component for at least 500ms
  pendingMinMs: 500,
});

function RouteComponent() {
  return <Outlet />;
}
