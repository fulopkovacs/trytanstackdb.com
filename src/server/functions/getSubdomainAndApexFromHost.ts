import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getTempDbIdFromTheSubdomain } from "@/utils/getTempDbIdFromSubdomain";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";

export const getSubdomainAndApexFromHost = createServerFn().handler(() => {
  const request = getRequest();
  const url = new URL(request.url);
  const protocol = url.protocol;
  const host = getHostFromRequest(request);
  const subdomain = getTempDbIdFromTheSubdomain(host);
  return {
    subdomain,
    protocol,
    apex: subdomain ? host?.replace(`${subdomain}.`, "") : host,
  };
});
