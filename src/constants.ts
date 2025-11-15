export const expiryTimestampMs = Date.now() + 60_000 * 60 * 24 * 365; // 1 yr
export const getApexDomainRedirectHref = (
  apex: string | undefined | null,
  protocol: string,
) => {
  // TODO: NODE_ENV should be imported from process.env.NODE_ENV
  if (!apex) {
    throw new Error("Apex domain is required for redirect href");
  }
  return `${protocol}//${apex}/`;
};
