import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { supabase } from "../lib/supabase";
import { observations } from "../data/observations";
import { redaction } from "../data/redaction";

interface SitemapEntry {
  loc: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  lastmod?: string;
}

const STATIC_URLS: SitemapEntry[] = [
  { loc: "/", priority: 1.0, changefreq: "daily" },
  { loc: "/metiers/", priority: 0.7, changefreq: "monthly" },
  { loc: "/departements/", priority: 0.7, changefreq: "monthly" },
  { loc: "/glossaire/", priority: 0.7, changefreq: "monthly" },
  { loc: "/outils/", priority: 0.7, changefreq: "monthly" },
  { loc: "/outils/grille-devis/", priority: 0.7, changefreq: "monthly" },
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

  const urls: SitemapEntry[] = [...STATIC_URLS];

  // URLs pSEO , pages metier nationales
  for (const m of siteConfig.metiersPilote) {
    urls.push({ loc: `/${m.slug}/`, priority: 0.8, changefreq: "weekly", lastmod: now });
  }
  // URLs pSEO , classement metier/departement
  for (const m of siteConfig.metiersPilote) {
    for (const d of siteConfig.departementsPilote) {
      urls.push({ loc: `/${m.slug}/${d.slug}/`, priority: 0.85, changefreq: "weekly", lastmod: now });
    }
  }

  // URLs observations , articles editoriaux
  for (const o of observations) {
    urls.push({
      loc: `/observations/${o.slug}/`,
      priority: 0.85,
      changefreq: "monthly",
      lastmod: (o.dateRevision || o.datePublication || now).split("T")[0],
    });
  }
  // URLs auteurs , pages redaction individuelles (E-E-A-T)
  for (const a of redaction) {
    urls.push({
      loc: `/redaction/${a.slug}/`,
      priority: 0.7,
      changefreq: "monthly",
      lastmod: now,
    });
  }

  // URLs pros , fetch depuis Supabase au build time
  try {
    const { data: pros } = await supabase
      .from("pros")
      .select("slug, updated_at")
      .eq("active", true)
      .not("slug", "is", null)
      .limit(5000);
    if (pros) {
      for (const p of pros) {
        urls.push({
          loc: `/pro/${p.slug}/`,
          priority: 0.6,
          changefreq: "monthly",
          lastmod: p.updated_at ? p.updated_at.split("T")[0] : now,
        });
      }
    }
  } catch (e) {
    console.warn("Sitemap: failed to fetch pros, skipping", e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
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
