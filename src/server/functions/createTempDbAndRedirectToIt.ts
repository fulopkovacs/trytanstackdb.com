import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";
import { seed } from "@/db/seed";
import {
  getSubdomainSafeIds,
  getTempDbIdFromTheSubdomain,
} from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";
import { env } from "cloudflare:workers";

export const createTempDbAndRedirectToIt = createServerFn().handler(
  async () => {
    const request = getRequest();
    const host = getHostFromRequest(request);
    const subdomain = getTempDbIdFromTheSubdomain(host);
    if (subdomain) {
      // TODO: redirect to the apex domain
      throw new Error(`Cannot create temp DB from a subdomain`);
    }
    const tempDbId = getSubdomainSafeIds();
    // TODO: change this later

    try {
      await db.insert(tempDbsTable).values({
        id: tempDbId,
        expiryTimestampMs:
          env.TEMP_DB_LIFETIME_MINUTES * 60 * 1000 + Date.now(),
      });
      // seed initial data for the new temp DB
      await seed(tempDbId);
    } catch (e) {
      console.error("Error creating temp DB:", e);
      // TODO: show error message on the client
      throw e;
    }

    throw redirect({
      href: `http://${tempDbId}.${host}/projects`,
    });
  },
);
