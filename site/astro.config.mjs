// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import { siteConfig } from "./site.config.ts";

export default defineConfig({
  site: siteConfig.url,
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: "auto",
  },
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
