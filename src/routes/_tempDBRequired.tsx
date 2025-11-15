import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getApexDomainRedirectHref } from "@/utils/server/getApexDomainRedirectHref";
import { checkIfTempDbExists } from "@/server/functions/checkIfTempDbExists";
import { getSubdomainAndApexFromHost } from "@/server/functions/getSubdomainAndApexFromHost";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

const mockUser = {
  id: "1",
  name: "John Doe",
};

const getTempDbId = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return tempId;
  });

export const Route = createFileRoute("/_tempDbRequired")({
  // component: RouteComponent,
  beforeLoad: async () => {
    // TODO: get tempdb
    const tempDbId = await getTempDbId();

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
