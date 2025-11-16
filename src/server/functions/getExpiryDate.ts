import { createServerFn } from "@tanstack/react-start";
import { requireTempId } from "../middlewares/getTempDbIdFromRequest";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getApexDomainRedirectHref } from "@/utils/server/getApexDomainRedirectHref";
import { getSubdomainAndApexFromHost } from "./getSubdomainAndApexFromHost";
import { redirect } from "@tanstack/react-router";

export const getExpiryDate = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    const { subdomain, apex, protocol } = await getSubdomainAndApexFromHost();
    // Fetch the expiry date from your database or any other source
    // For demonstration, we'll just return a date 30 minutes from now
    const [data] = await db
      .select()
      .from(tempDbsTable)
      .where(eq(tempDbsTable.id, tempId));

    if (!data) {
      throw redirect({
        href: getApexDomainRedirectHref(apex, protocol),
      });
    }

    return data.expiryTimestampMs;
  });
