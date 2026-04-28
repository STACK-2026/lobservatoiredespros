import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { getExtensionPros } from "../lib/pros-all";

const SHARD_SIZE = 5000;
const MAX_SHARDS = 100;

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();
  const base = siteConfig.url.replace(/\/$/, "");

  // Discover shard count for the long-tail SSR pros (sitemap-pros-ext-N).
  let extShardCount = 0;
  try {
    const all = await getExtensionPros();
    extShardCount = Math.min(MAX_SHARDS, Math.max(0, Math.ceil(all.length / SHARD_SIZE)));
  } catch (e) {
    console.warn("sitemap-index: failed to count ext pros, skipping", e);
  }

  const sitemaps: string[] = [`  <sitemap>
    <loc>${base}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`];

  for (let i = 0; i < extShardCount; i++) {
    sitemaps.push(`  <sitemap>
    <loc>${base}/sitemap-pros-ext-${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
