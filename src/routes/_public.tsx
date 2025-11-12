import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionDataFn } from "@/server/functions/getUserFromSessionFn";

export const Route = createFileRoute("/_public")({
  beforeLoad: async () => {
    const sessionData = await getSessionDataFn();

    // Make sure the user is not logged in
    if (sessionData?.user) {
      throw redirect({
        to: "/boards",
      });
    }
  },
});
