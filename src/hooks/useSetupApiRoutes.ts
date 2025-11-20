import { useEffect } from "react";
import { API } from "@/local-api";
import {
  type APIType,
  type RequestData,
  requestSchema,
  type ResponseData,
} from "@/local-api/helpers";

/**
  `Response` objects can't transferred via postMessage
  (because they can't be cloned), so we need to reconstruct
  and deconstruct them in the main thread.
  */
function constructRequestForHandler(requestData: RequestData): {
  request: Request;
} {
  return {
    request: new Request(requestData.pathname, {
      method: requestData.method,
      headers: {
        "Content-Type": "application/json",
      },
      ...("requestBody" in requestData
        ? {
            body: requestData.requestBody
              ? JSON.stringify(requestData.requestBody)
              : undefined,
          }
        : {}),
    }),
  };
}

async function deconstructResponseFromHandler(
  response: Response,
): Promise<ResponseData> {
  const contentType = response.headers?.get("Content-Type") || "";
  let body: any = null;
  const clone = response.clone();

  try {
    if (contentType.includes("application/json")) {
      // Clone request to read the body
      body = await clone.json();
    } else {
      body = await clone.text();
    }
  } catch (e) {
    console.error("Error reading response body:", e);
    throw e;
  }

  return {
    body,
    status: response.status,
  } satisfies ResponseData;
}

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
