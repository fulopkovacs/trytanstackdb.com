/** TODO: rename this file */

import { createIsomorphicFn } from "@tanstack/react-start";
import z from "zod";
import { apiRequestsCollection } from "@/collections/apiRequests";
import { client } from "@/db";
import { migrate } from "@/db/migrate";
import { seed } from "@/db/seed";
import { API } from "@/local-api";
import type { APIType } from "@/local-api/helpers";
import {
  constructRequestForHandler,
  deconstructResponseFromHandler,
  requestSchema,
} from "@/local-api/helpers";

export const API_LATENCY_LOCALSTORAGE_KEY = "__TRYTANSTACKDB_API_DELAY_MS__";
export const apiLatencyInMsSchema = z
  .string()
  .transform((t) => parseInt(t, 10))
  .default(1_000)
  .catch(1_000);

export const setupServiceWorkerHttpsProxy = createIsomorphicFn().client(
  async () => {
    const serviceProxyEnabledVar = "__SERVICE_WORKER_HTTP_PROXY_ENABLED__";
    // @ts-expect-error
    if (!window[serviceProxyEnabledVar]) {
      // Wait for service worker with retries at 0s, 1s, 2s, 3s
      const waitForServiceWorker = async () => {
        if (!("serviceWorker" in navigator)) {
          throw new Error("Service workers are not supported in this browser");
        }

        const delays = [0, 1000, 2000, 3000]; // Try immediately, then after 1s, 2s, 3s

        for (const delay of delays) {
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          try {
            // Check if serviceWorker is available
            if (navigator.serviceWorker) {
              await navigator.serviceWorker.ready;
              return; // Success!
            }
          } catch (error) {
            console.warn(
              `Service worker check attempt failed after ${delay}ms:`,
              error,
            );
          }
        }

        throw new Error("Service worker not ready after retries");
      };

      try {
        await waitForServiceWorker();

        navigator.serviceWorker.addEventListener("message", async (event) => {
          if (event.data?.type === "PROCESS_REQUEST") {
            const port = event.ports[0]; // MessageChannel port for response

            // Ensure the database client is ready
            await client.waitReady;

            const result = await processRequestInMainThread(event.data.body);

            // Send result back to the service worker on the dedicated port
            port.postMessage({ result });
          }
        });

        async function processRequestInMainThread(body: any) {
          const requestData = requestSchema.parse(body);
          const handler = (API as APIType)[requestData.pathname][
            requestData.method
          ];
          if (handler) {
            // Generate unique request ID for tracking
            const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const startTime = performance.now();

            // Emit "started" event immediately so UI shows pending state
            apiRequestsCollection.insert({
              id: requestId,
              timestamp: Date.now(),
              method: requestData.method,
              pathname: requestData.pathname,
              requestBody: requestData.requestBody,
              status: "pending",
              duration: null,
            });

            // Simulate a delay for demonstration purposes
            const delay = apiLatencyInMsSchema.parse(
              localStorage.getItem(API_LATENCY_LOCALSTORAGE_KEY),
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

            const response = await deconstructResponseFromHandler(
              await handler(constructRequestForHandler(requestData)),
            );

            const duration = performance.now() - startTime;

            apiRequestsCollection.update(requestId, (draft) => {
              draft.responseBody = response.body;
              draft.status = response.status;
              draft.duration = duration;

              return draft;
            });

            return response;
          } else {
            throw new Error("No handler found for this request");
          }
        }
        // @ts-expect-error
        window[serviceProxyEnabledVar] = true;
      } catch (error) {
        console.error("Failed to setup service worker proxy:", error);
        // Don't throw - allow the app to continue without service worker
      }
    }
  },
);

export const setupPGlite = createIsomorphicFn().client(async () => {
  const pgliteVarName = "__PG_LITE_SETUP_DONE__";

  // @ts-expect-error
  if (!window[pgliteVarName]) {
    await migrate();
    await seed();
    // @ts-expect-error
    window[pgliteVarName] = true;
  }
});
