import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { setupPgliteInTheBrowser } from "@/client/pgliteHelpers";
import { API } from "@/local-api";
import {
  type APIType,
  constructRequestForHandler,
  deconstructResponseFromHandler,
  requestSchema,
} from "@/local-api/helpers";

const setupPglite = createIsomorphicFn().client(async () => {
  await setupPgliteInTheBrowser();
});

const setupServiceWorkerHttpsProxy = createIsomorphicFn().client(async () => {
  const serviceProxyEnabledVar = "__SERVICE_WORKER_HTTP_PROXY_ENABLED__";
  // @ts-expect-error
  if (!window[serviceProxyEnabledVar]) {
    // console.log("---->adding the event listener");
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data?.type === "PROCESS_REQUEST") {
        const port = event.ports[0]; // MessageChannel port for response
        // const {body, method, pathname} = event.data;

        // Call your function with the request body (dummy processing here)
        const result = await processRequestInMainThread(event.data.body);

        // Send result back to the service worker on the dedicated port
        port.postMessage({ result });
      }
    });

    async function processRequestInMainThread(body: any) {
      try {
        const requestData = requestSchema.parse(body);
        const handler = (API as APIType)[requestData.pathname][
          requestData.method
        ];
        if (handler) {
          // simulate some delay with setTimeout
          return await deconstructResponseFromHandler(
            await handler(constructRequestForHandler(requestData)),
          );
        } else {
          throw new Error("No handler found for this request");
        }
      } catch (e) {
        // TODO: Handle validation errors
        throw e;
        // return { error: "Invalid request data" };
      }
      // Your main thread logic here (simulate async work)
      // return `Processed payload: ${JSON.stringify(body)}`;
    }
    // @ts-expect-error
    window[serviceProxyEnabledVar] = true;
  }
});

export const Route = createFileRoute("/_tutorial/_db")({
  // the database is local to the browser, so no SSR
  ssr: false,
  beforeLoad: async () => {
    await setupServiceWorkerHttpsProxy();
    await setupPglite();
  },
  component: RouteComponent,
});

function RouteComponent() {
  // Setup the API routes to handle requests
  // useSetupApiRoutes();

  return <Outlet />;
}
