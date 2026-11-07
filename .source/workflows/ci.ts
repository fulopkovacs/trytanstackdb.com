import { defineWorkflow, pullRequest, push } from "@tanstack-source/ci";

// `setup.pnpm()` reads only the top-level `packageManager` field, but this
// project names its pnpm in `devEngines.packageManager`.
const setupPnpm = {
  name: "Set up pnpm",
  run: `npm install --global "pnpm@$(node -p 'require("./package.json").devEngines.packageManager.version')"`,
};
const install = { name: "Install", run: "pnpm install --frozen-lockfile" };

// Checks every pull request into `v2`, and deploys each push to `v2` to
// https://v2.trytanstackdb.com (see `cloudflare.config.ts`).
export default defineWorkflow("ci", {
  on: [pullRequest({ branches: ["v2"] }), push({ branches: ["v2"] })],
})
  .job("check", {
    egress: ["registry.npmjs.org"],
    steps: [
      setupPnpm,
      install,
      { name: "Format, lint and type check", run: "pnpm exec vp check" },
      { name: "Test", run: "pnpm exec vp test" },
    ],
  })
  .job("deploy", {
    needs: ["check"],
    if: (ctx) => ctx.event === "push",
    secrets: { CLOUDFLARE_API_TOKEN: {} },
    egress: ["registry.npmjs.org", "api.cloudflare.com"],
    env: { CF_SEND_TELEMETRY: "false" },
    steps: [setupPnpm, install, { name: "Deploy", run: "pnpm exec cf deploy" }],
  });
