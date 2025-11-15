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
