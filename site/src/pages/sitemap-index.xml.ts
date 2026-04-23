import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();
  const base = siteConfig.url.replace(/\/$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${base}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
