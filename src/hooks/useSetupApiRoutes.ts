import { useEffect } from "react";
import { API } from "@/local-api";
import {
  type APIType,
  constructRequestForHandler,
  deconstructResponseFromHandler,
  requestSchema,
} from "@/local-api/helpers";

/**
  Set up the request handlers that will process the API requests
  coming from the service worker proxy.

  TODO: move it to the loader of a client-rendered route?
*/
export function useSetupApiRoutes() {
  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, []);
}
