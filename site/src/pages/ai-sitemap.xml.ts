/**
 * Surface d'orientation complémentaire vers le contenu éditorial et les
 * données agrégées. Le sitemap XML standard reste la source de découverte
 * principale et documentée par les moteurs de recherche.
 */
import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { observations } from "../data/observations";
import { getAggregateDatasetCatalog } from "../lib/dataset-catalog";

export const GET: APIRoute = async () => {
  const base = siteConfig.url.replace(/\/$/, "");
  const catalog = await getAggregateDatasetCatalog();
  const dataModified = catalog.dataModified || "2026-07-27";

  const urls: { loc: string; lastmod: string; priority: number; desc: string }[] = [
    { loc: "/", lastmod: dataModified, priority: 1.0, desc: "Accueil" },
    { loc: "/donnees/", lastmod: dataModified, priority: 1.0, desc: "Catalogue des données agrégées" },
    { loc: "/donnees/classements.json", lastmod: dataModified, priority: 0.95, desc: "Agrégats JSON" },
    { loc: "/donnees/classements.csv", lastmod: dataModified, priority: 0.95, desc: "Agrégats CSV" },
    { loc: "/donnees/catalogue.json", lastmod: dataModified, priority: 0.9, desc: "Catalogue Schema.org" },
    { loc: "/methode/", lastmod: "2026-04-01", priority: 0.95, desc: "Méthodologie du Score de Confiance" },
    { loc: "/a-propos/", lastmod: "2026-04-01", priority: 0.9, desc: "Identité et mission" },
    { loc: "/redaction/", lastmod: "2026-07-27", priority: 0.8, desc: "Signature institutionnelle et principes" },
    { loc: "/glossaire/", lastmod: "2026-04-01", priority: 0.85, desc: "Glossaire BTP et certifications" },
  ];

  // Articles observations , contenu long, signe, citable
  for (const o of observations) {
    urls.push({
      loc: `/observations/${o.slug}/`,
      lastmod: (o.dateRevision || o.datePublication).split("T")[0],
      priority: 0.9,
      desc: o.tldr.substring(0, 200),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
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
      "X-AI-Crawler-Sitemap": "true",
    },
  });
};
