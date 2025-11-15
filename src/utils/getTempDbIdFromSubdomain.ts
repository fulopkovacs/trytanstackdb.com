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
