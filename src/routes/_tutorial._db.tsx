import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  setupPGlite,
  setupServiceWorkerHttpsProxy,
} from "@/client/pgliteHelpers";
import { boardCollection } from "@/collections/boards";
import { projectsCollection } from "@/collections/projects";
import { todoItemsCollection } from "@/collections/todoItems";
import { FakeProgressIndicator } from "@/components/FakeProgressIndicator";

const COLLECTIONS_ARE_READY_GLOBAL_VAR_NAME = "__COLLECTIONS_ARE_READY__";

export const Route = createFileRoute("/_tutorial/_db")({
  // the database is local to the browser, so no SSR
  ssr: false,
  beforeLoad: async () => {
    // we don't need this to run
    await setupServiceWorkerHttpsProxy();
    await setupPGlite();
  },
  loader: async () => {
    /*
      NOTE: this looks terrible, but I needed a quick way to ensure
      that the fake progress bar is shown until all the collections
      are loaded.

      This hacky solution seemed to be the easiest: the pending component
      will be shown until all promises are resolved in the loader,
      and the global variable is used to to make sure that the statements
      in the if block are not executed on client-side route changes.
    */
    // @ts-expect-error
    if (!window[COLLECTIONS_ARE_READY_GLOBAL_VAR_NAME]) {
      await projectsCollection.stateWhenReady();
      await boardCollection.stateWhenReady();
      await todoItemsCollection.stateWhenReady();
      // @ts-expect-error
      window[COLLECTIONS_ARE_READY_GLOBAL_VAR_NAME] = true;
    }
  },
  component: RouteComponent,
  pendingComponent: FakeProgressIndicator,
  // Show the pending component for at least 500ms
  pendingMinMs: 500,
});

function RouteComponent() {
  return <Outlet />;
}
