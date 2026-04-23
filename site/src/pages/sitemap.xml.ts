import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";

const STATIC_URLS = [
  { loc: "/", priority: 1.0, changefreq: "daily" },
  { loc: "/metiers/", priority: 0.7, changefreq: "monthly" },
  { loc: "/departements/", priority: 0.7, changefreq: "monthly" },
  { loc: "/glossaire/", priority: 0.7, changefreq: "monthly" },
  { loc: "/outils/", priority: 0.7, changefreq: "monthly" },
  { loc: "/methode/", priority: 0.9, changefreq: "monthly" },
  { loc: "/a-propos/", priority: 0.7, changefreq: "monthly" },
  { loc: "/redaction/", priority: 0.6, changefreq: "monthly" },
  { loc: "/candidater/", priority: 0.9, changefreq: "monthly" },
  { loc: "/observations/", priority: 0.8, changefreq: "weekly" },
  { loc: "/archives/", priority: 0.6, changefreq: "monthly" },
  { loc: "/contact/", priority: 0.5, changefreq: "yearly" },
  { loc: "/mentions-legales/", priority: 0.3, changefreq: "yearly" },
  { loc: "/politique-confidentialite/", priority: 0.3, changefreq: "yearly" },
  { loc: "/cgu/", priority: 0.3, changefreq: "yearly" },
  { loc: "/newsletter/", priority: 0.5, changefreq: "monthly" },
];

export const GET: APIRoute = async () => {
  const now = new Date().toISOString().split("T")[0];
  const base = siteConfig.url.replace(/\/$/, "");

  // URLs statiques
  const urls = [...STATIC_URLS];

  // NOTE : pages pSEO [metier]/[dept]/ sont noindex tant que les donnees ne sont pas scrapees reellement.
  // Elles seront reintegrees au sitemap une fois le pipeline Sirene en place.

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(2)}</priority>
  </url>`
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
