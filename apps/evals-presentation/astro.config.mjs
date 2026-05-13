import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { themeConfig } from "@bleedingdev/presentation-core/config/theme.config";

export default defineConfig({
  site: "http://localhost:4445",
  base: "/",
  server: {
    port: 4445,
  },
  integrations: [
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        themes: {
          light: themeConfig.shiki.light,
          dark: themeConfig.shiki.dark,
        },
        defaultColor: false,
        wrap: true,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
      minify: true,
    },
  },
});
