import { createServerFn } from "@tanstack/react-start";
import { authSessionMiddleware } from "@/lib/auth-middleware";

export const getSessionDataFn = createServerFn()
  .middleware([authSessionMiddleware])
  .handler(async ({ context }) => {
    return context.sessionData;
  });
