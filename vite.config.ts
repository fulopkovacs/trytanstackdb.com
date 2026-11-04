import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const config = defineConfig({
  fmt: {
    ignorePatterns: [
      "src/routeTree.gen.ts",
      // Copied verbatim from a package; the guide quotes it.
      "src/guide/vendor/**",
      ".intent/**",
      ".claude/**",
      ".codex/**",
    ],
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts", ".intent/**", ".claude/**", ".codex/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: { tsconfigPaths: true },
  // The dev server is also opened from other devices over Tailscale, by
  // machine name (`http://pop-os:3000`) or MagicDNS name (`*.ts.net`).
  server: { allowedHosts: ["pop-os", ".ts.net"] },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
  plugins: lazyPlugins(() =>
    // Unit tests only cover plain TypeScript; they don't need the app's build plugins
    // (the Cloudflare plugin in particular can't run inside Vitest).
    process.env.VITEST
      ? []
      : [
          devtools(),
          cloudflare({ viteEnvironment: { name: "ssr" } }),
          tailwindcss(),
          tanstackStart(),
          viteReact(),
        ],
  ),
});

export default config;
