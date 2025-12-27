import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  setupPGlite,
  setupServiceWorkerHttpsProxy,
} from "@/client/pgliteHelpers";
import { userPreferencesCollection } from "@/collections/UserPreferences";
import { FakeProgressIndicator } from "@/components/FakeProgressIndicator";
import { USER_PLACEHOLDER } from "@/USER_PLACEHOLDER_CONSTANT";

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
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existingUser = userPreferencesCollection.get(USER_PLACEHOLDER.id);

      if (!existingUser) {
        userPreferencesCollection.insert({
          id: USER_PLACEHOLDER.id,
        });
      }
    }
  }, []);

  return <Outlet />;
}
