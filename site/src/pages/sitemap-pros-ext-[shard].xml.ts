import type { APIRoute, GetStaticPaths } from "astro";
import { siteConfig } from "../utils/config";
import { getExtensionPros } from "../lib/pros-all";

const SHARD_SIZE = 5000;
// Hard cap : 100 shards x 5000 = 500k URLs (Google soft limit per sitemap is
// 50k URLs; we shard at 5k for fast incremental crawl + cache friendliness).
const MAX_SHARDS = 100;

export const getStaticPaths: GetStaticPaths = async () => {
  // Pre-build the path list at static-generation time. We need to know how
  // many shards exist so each one becomes its own static .xml file.
  const all = await getExtensionPros();
  const total = all.length;
  const shardCount = Math.min(MAX_SHARDS, Math.max(0, Math.ceil(total / SHARD_SIZE)));
  const paths: { params: { shard: string } }[] = [];
  for (let i = 0; i < shardCount; i++) {
    paths.push({ params: { shard: String(i) } });
  }
  return paths;
};

export const GET: APIRoute = async ({ params }) => {
  const shardIdx = parseInt(String(params.shard ?? "0"), 10);
  if (Number.isNaN(shardIdx) || shardIdx < 0) {
    return new Response("Invalid shard", { status: 400 });
  }

  const all = await getExtensionPros();
  const start = shardIdx * SHARD_SIZE;
  const end = start + SHARD_SIZE;
  const slice = all.slice(start, end);
  const base = siteConfig.url.replace(/\/$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${slice
  .map(
    (r) => `  <url>
    <loc>${base}/pro/${r.slug}/</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
