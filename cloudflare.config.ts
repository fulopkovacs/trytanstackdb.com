import { defineConfig, triggers } from "cf/config";

export default defineConfig({
  // The "Personal" account, which owns the trytanstackdb.com zone.
  accountId: "496bc6a013e5a1d20615c2976e3e16c9",
  worker: {
    name: "trytanstackdb-v2",
    compatibilityDate: "2025-09-02",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "@tanstack/react-start/server-entry",
    // The custom domain creates the DNS record for the subdomain.
    domains: ["v2.trytanstackdb.com"],
    // The v1 worker (`trytanstackdb`) has a `*.trytanstackdb.com/*` route that
    // also matches this subdomain and wins over the custom domain. This more
    // specific route sends v2 traffic to this worker instead.
    triggers: [triggers.fetch({ pattern: "v2.trytanstackdb.com/*", zone: "trytanstackdb.com" })],
  },
});
