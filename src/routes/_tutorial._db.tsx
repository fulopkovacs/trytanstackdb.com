import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { migrate } from "@/db/migrate";
import { seed } from "@/db/seed";
import { useSetupApiRoutes } from "@/hooks/useSetupApiRoutes";

const setupPglite = createIsomorphicFn().client(async () => {
  const pgliteVarName = "__PG_LITE_SETUP_DONE__";

  // @ts-expect-error
  if (!window[pgliteVarName]) {
    await migrate();
    await seed();
    // @ts-expect-error
    window[pgliteVarName] = true;
  }
  // BUG: On Chrome, the user might reload the page to see the interface
  // it's because of pglite or something
});

export const Route = createFileRoute("/_tutorial/_db")({
  // the database is local to the browser, so no SSR
  ssr: false,
  beforeLoad: async () => {
    await setupPglite();
  },
  component: RouteComponent,
});

function RouteComponent() {
  // Setup the API routes to handle requests
  useSetupApiRoutes();

  return <Outlet />;
}
