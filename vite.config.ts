import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
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
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    mdx({
      rehypePlugins: [
        [
          rehypeShiki,
          {
            themes: {
              light: "material-theme-lighter",
              dark: "material-theme-darker",
            },
            defaultColor: false,
            transformers: [
              {
                name: "add-language-data-attribute",
                pre(node: { properties: Record<string, string> }) {
                  const lang = (
                    this as unknown as { options: { lang?: string } }
                  ).options.lang;
                  if (lang) {
                    node.properties["data-language"] = lang;
                  }
                },
              },
            ],
          },
        ],
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
});

export default config;
