import { createFileRoute, redirect } from "@tanstack/react-router";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { checkIfTempDbExists } from "@/server/functions/checkIfTempDbExists";
import { getSubdomainAndApexFromHost } from "@/server/functions/getSubdomainAndApexFromHost";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";
import { getTempDbIdFromTheSubdomain } from "@/utils/getTempDbIdFromSubdomain";
import { getApexDomainRedirectHref } from "@/utils/server/getApexDomainRedirectHref";

const mockUser = {
  id: "1",
  name: "John Doe",
};

const getTempDbIdOnServer = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return tempId;
  });

const getTempId = createIsomorphicFn()
  .server(async () => {
    return await getTempDbIdOnServer();
  })
  .client(() => {
    const url = new URL(window.location.href);
    const tempId = getTempDbIdFromTheSubdomain(url.host);

    return tempId;
  });

export const Route = createFileRoute("/_tempDbRequired")({
  // component: RouteComponent,
  beforeLoad: async () => {
    // TODO: get tempdb
    const tempDbId = await getTempId();

    return {
      user: mockUser,
      tempDbId,
    };
  },
  loader: async ({ context }) => {
    const { subdomain, apex, protocol } = await getSubdomainAndApexFromHost();

    if (subdomain) {
      const tempDbExists = await checkIfTempDbExists({
        data: { tempDbId: subdomain },
      });

      if (!tempDbExists) {
        // redirect to the apex
        // throw new Response("Temporary database not found", { status: 404 });
        throw redirect({
          href: `${getApexDomainRedirectHref(apex, protocol)}?temp_db_missing=${subdomain}`,
        });
      }
    }

    return {
      tempDbId: context.tempDbId,
    };
  },
});
