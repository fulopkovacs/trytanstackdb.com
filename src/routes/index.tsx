import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

const getIsMobile = createServerFn().handler(async () => {
  const userAgent = getRequestHeader("user-agent") || "";
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
});

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const isMobile = await getIsMobile();

    if (isMobile) {
      throw redirect({
        to: "/mobile",
      });
    }

    throw redirect({
      to: "/projects",
    });
  },
});
