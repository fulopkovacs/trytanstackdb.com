import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { customAlphabet } from "nanoid";
import { tempDbsTable } from "@/db/schema";
import { getHostFromRequest } from "./getHostFromRequest";

export class NoSubdomainProvidedError extends Error {
  constructor() {
    super("No subdomain provided");
    this.name = "NoSubdomainProvidedError";
  }
}

export class NoTempDbRecordFoundError extends Error {
  constructor(tempDbId: string) {
    super(`No temp DB record found for tempDbId: ${tempDbId}`);
    this.name = "NoTempDbRecordFoundError";
  }
}

export class TempDbExpiredError extends Error {
  constructor(tempDbId: string) {
    super(`Temp DB with id ${tempDbId} has expired`);
    this.name = "TempDbExpiredError";
  }
}

export function getTempDbIdFromTheSubdomain(hostname?: string | null) {
  if (!hostname) return null;

  const domainParts = hostname.split(".");

  const hasTempId =
    // <subdomain>.localhost:8787
    domainParts[1]?.startsWith("localhost") ||
    // <subdomain>.trytanstackdb.dev
    domainParts.length > 2;

  if (hasTempId) {
    const [tempId] = hostname.split(".");
    return tempId;
  } else {
    return null;
  }
}

export async function checkIfValidTempDbExists(
  tempDbId: string,
  db: DrizzleD1Database,
) {
  const [tempDbRecord] = await db
    .select()
    .from(tempDbsTable)
    .where(eq(tempDbsTable.id, tempDbId));

  const now = Date.now();
  if (!tempDbRecord) {
    throw new NoTempDbRecordFoundError(tempDbId);
  } else if (tempDbRecord.expiryTimestampMs < now) {
    throw new TempDbExpiredError(tempDbId);
  }
}

export async function getTempDbId(r: Request, db: DrizzleD1Database) {
  const host = getHostFromRequest(r);
  const subdomain = getTempDbIdFromTheSubdomain(host);
  if (!subdomain) {
    throw new NoSubdomainProvidedError();
  }

  await checkIfValidTempDbExists(subdomain, db);
  return {
    tempDbId: subdomain,
  };
}

export function getSubdomainSafeIds() {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 23);
  return nanoid();
}
