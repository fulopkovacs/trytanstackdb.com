import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionDataFn } from "@/server/functions/getUserFromSessionFn";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const sessionData = await getSessionDataFn();

    // Make sure the user is logged in
    if (!sessionData?.user) {
      throw redirect({
        to: "/login",
      });
    }

    return { user: sessionData.user };
  },
});
