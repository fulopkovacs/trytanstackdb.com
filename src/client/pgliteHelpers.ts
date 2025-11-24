import { createIsomorphicFn } from "@tanstack/react-start";
import { migrate } from "@/db/migrate";
import { seed } from "@/db/seed";
import { API } from "@/local-api";
import type { APIType } from "@/local-api/helpers";

export const setupPglite = createIsomorphicFn().client(async () => {
  if (typeof window === "undefined")
    throw new Error("PGlite is only supported in the browser environment.");

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

export const setupServiceWorkerHttpsProxy = createIsomorphicFn().client(
  async () => {
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
        const {
          constructRequestForHandler,
          deconstructResponseFromHandler,
          requestSchema,
        } = await import("@/local-api/helpers");
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
  },
);

export async function setupPgliteInTheBrowser() {
  const pgliteVarName = "__PG_LITE_SETUP_DONE__";

  // @ts-expect-error
  if (!window[pgliteVarName]) {
    await migrate();
    await seed();
    // @ts-expect-error
    window[pgliteVarName] = true;
  }
}
