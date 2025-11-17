import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypePrism from "rehype-prism-plus";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  // server: {
  //   host: true,
  //   hmr: {
  //     host: "localhost", // or leave undefined for all
  //   },
  //   allowedHosts: [".localhost"],
  // },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    mdx({
      rehypePlugins: [rehypePrism],
    }),
  ],
});

export default config;
