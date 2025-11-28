/** TODO: rename this file */

import { createIsomorphicFn } from "@tanstack/react-start";
import z from "zod";
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

export const NETWORK_LATENCY_LOCALSTORAGE_KEY =
  "__TRYTANSTACKDB_API_DELAY_MS__";
export const networkLatencyInMsSchema = z
  .string()
  .transform((t) => parseInt(t, 10))
  .default(1_000)
  .catch(1_000);

export const setupServiceWorkerHttpsProxy = createIsomorphicFn().client(
  async () => {
    const serviceProxyEnabledVar = "__SERVICE_WORKER_HTTP_PROXY_ENABLED__";
    // @ts-expect-error
    if (!window[serviceProxyEnabledVar]) {
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
        try {
          const requestData = requestSchema.parse(body);
          const handler = (API as APIType)[requestData.pathname][
            requestData.method
          ];
          if (handler) {
            /*
              TODO: Currently, this request will not show up in the
              Network tab of DevTools until the delay is over.
              We should find a way to make it appear in a PENDING state.
            */
            // Simulate a delay for demonstration purposes

            const delay = networkLatencyInMsSchema.parse(
              localStorage.getItem(NETWORK_LATENCY_LOCALSTORAGE_KEY),
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

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
      }
      // @ts-expect-error
      window[serviceProxyEnabledVar] = true;
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
