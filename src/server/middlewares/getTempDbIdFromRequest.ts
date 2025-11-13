import { getTempDbIdFromTheSubdomain } from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";
import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireTempId = createMiddleware().server(({ next }) => {
  const request = getRequest();
  const host = getHostFromRequest(request);
  const tempId = getTempDbIdFromTheSubdomain(host);

  if (!tempId) {
    throw redirect({
      to: '/'
    })
  }


  // hello
  return next({
    context: {
      tempId
    },
  });
});
