import { env } from "cloudflare:workers";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";
import { seed } from "@/db/seed";
import { getTempDbIdFromTheSubdomain } from "@/utils/getTempDbIdFromSubdomain";
import { getSubdomainSafeIds } from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";

export const createTempDbAndRedirectToIt = createServerFn().handler(
  async () => {
    const request = getRequest();
    const host = getHostFromRequest(request);
    const subdomain = getTempDbIdFromTheSubdomain(host);
    if (subdomain) {
      // TODO: redirect to the apex domain
      throw new Error(`Cannot create temp DB from a subdomain`);
    }

    let projectId: string | null = null;

    const tempDbId = getSubdomainSafeIds();
    // TODO: change this later

    try {
      await db.insert(tempDbsTable).values({
        id: tempDbId,
        expiryTimestampMs:
          env.TEMP_DB_LIFETIME_MINUTES * 60 * 1000 + Date.now(),
      });
      // seed initial data for the new temp DB
      const { firstProjectId } = await seed(tempDbId);

      projectId = firstProjectId;
    } catch (e) {
      console.error("Error creating temp DB:", e);
      // TODO: show error message on the client
      throw e;
    }

    if (!projectId) {
      throw redirect({
        to: "/",
        search: {
          error:
            "Could not create a new temporary database. Please try again later.",
        },
      });
    }

    throw redirect({
      href: `http://${tempDbId}.${host}/projects/${projectId}`,
    });
  },
);
