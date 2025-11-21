import { customAlphabet } from "nanoid";

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

export function getSubdomainSafeIds() {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 23);
  return nanoid();
}
