import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";
import { seed } from "@/db/seed";
import {
  getSubdomainSafeIds,
  getTempDbIdFromTheSubdomain,
} from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";

export const Route = createFileRoute("/api/temp-db")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = getHostFromRequest(request);

        return json(host);
      },
      POST: async ({ request }) => {
        const host = getHostFromRequest(request);
        const subdomain = getTempDbIdFromTheSubdomain(host);
        console.log({ subdomain });
        if (subdomain) {
          return new Response(`Cannot create temp DB from a subdomain`, {
            status: 400,
          });
        }

        const tempDbId = getSubdomainSafeIds();
        console.log({ tempDbId });
        // const expiryTimestampMs = Date.now() + 30_000; // 30 seconds from now
        const expiryTimestampMs = Date.now() + 60_000 * 60; // 1 hr
        try {
          await db.insert(tempDbsTable).values({
            id: tempDbId,
            expiryTimestampMs,
          });
          // seed initial data for the new temp DB
          await seed(tempDbId);

          const message = `✅ New temp DB created
id:         ${tempDbId}
expires at: ${new Date(expiryTimestampMs).toISOString()}
link: http://${tempDbId}.localhost:8787/get/boards
try:
curl ${tempDbId}.localhost:8787/get/boards
`;

          return new Response(message, { status: 201 });
        } catch (error) {
          console.error("Error creating temp DB:", error);
          return new Response(`Error creating temp DB: ${error}`, {
            status: 500,
          });
        }

        // const host = request.headers.get("host");
        //
        // return new Response(`Host header is: ${host}`);
      },
    },
  },
});
