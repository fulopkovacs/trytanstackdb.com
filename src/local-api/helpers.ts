import z from "zod";

type Pathname = string;

export type APIRequest = {
  path: string;
  method: string;
  body: any;
};

export const projectUpdateDataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export const methodShema = z.enum(["GET", "PATCH", "POST", "DELETE"]);

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

export const responseSchema = z.object({
  body: z.any().optional(),
  status: z.number(),
});

export type RequestData = z.infer<typeof requestSchema>;
export type ResponseData = z.infer<typeof responseSchema>;

export function json(
  body: any,
  opts?: {
    status?: number;
  },
) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    ...opts,
  });
}
