import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { authClient } from "@/lib/auth-client";

export const authSessionMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const { data: sessionData } = await authClient.getSession({
      fetchOptions: { headers: request.headers },
    });

    return next({
      context: {
        sessionData,
      },
    });
  },
);

export const authRequiredMiddleware = createMiddleware()
  .middleware([authSessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.sessionData?.user) {
      throw redirect({
        to: "/login",
      });
    }

    return next({
      context: {
        sessionData: context.sessionData,
      },
    });
  });
