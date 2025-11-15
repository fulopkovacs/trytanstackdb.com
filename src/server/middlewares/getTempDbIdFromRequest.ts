import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getTempDbIdFromTheSubdomain } from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";

export const requireTempId = createMiddleware().server(({ next }) => {
  const request = getRequest();
  const host = getHostFromRequest(request);
  const tempId = getTempDbIdFromTheSubdomain(host);

  if (!tempId) {
    throw redirect({
      to: "/",
    });
  }

  return next({
    context: {
      tempId,
    },
  });
});

export const getTempDbIdFromRequest = createMiddleware().server(({ next }) => {
  const request = getRequest();
  const host = getHostFromRequest(request);
  const tempId = getTempDbIdFromTheSubdomain(host);

  if (!tempId) {
    throw new Response(`Request must be sent to a subdomain.`, {
      status: 400,
    });
  }

  return next({
    context: {
      tempId,
    },
  });
});
