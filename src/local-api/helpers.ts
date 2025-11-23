import z from "zod";

type Pathname = string;

type ResponseData = {
  contentType: "application/json" | "text/plain";
  status: number;
  body?: any;
};

const methodShema = z.enum(["GET", "PATCH", "POST", "DELETE"]);

type Method = z.infer<typeof methodShema>;

export type APIRouteHandler = Partial<
  Record<Method, (payload: { request: Request }) => Promise<Response>>
>;

export type APIType = Record<Pathname, APIRouteHandler>;

export const requestSchema = z.object({
  pathname: z.string().min(1),
  method: methodShema,
  requestBody: z.any().optional(),
});

export type RequestData = z.infer<typeof requestSchema>;

export function json(
  body: any,
  opts?: {
    status?: number;
  },
) {
  const res = new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    ...opts,
  });
  return res;
}

/**
  `Response` objects can't transferred via postMessage
  (because they can't be cloned), so we need to reconstruct
  and deconstruct them in the main thread.
  */
export function constructRequestForHandler(requestData: RequestData): {
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

export async function deconstructResponseFromHandler(
  response: Response,
): Promise<ResponseData> {
  const contentType = response.headers?.get("Content-Type") || "";
  let body: any = null;
  const clone = response.clone();
  console.info({ response });

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
    contentType: contentType.includes("application/json")
      ? "application/json"
      : "text/plain",
    body,
    status: response.status,
  } satisfies ResponseData;
}
