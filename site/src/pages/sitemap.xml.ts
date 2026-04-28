import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { supabase, getMetiers, getZones, getMetierDeptCombos } from "../lib/supabase";
import { observations } from "../data/observations";
import { redaction } from "../data/redaction";
import wave1Pros from "../data/wave1_pros.json";

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

  // URLs pSEO , DB-backed : seuls les combos avec au moins un pro actif
  // sont listés (évite thin content + index bloat après seed 15×96=1440).
  try {
    const [metiers, zones, combos] = await Promise.all([
      getMetiers(),
      getZones("departement"),
      getMetierDeptCombos(),
    ]);

    const metiersWithPros = new Set<string>();
    for (const combo of combos) {
      metiersWithPros.add(combo.split(":")[0]);
    }

    // /[metier]/ , seulement les métiers ayant au moins un pro
    for (const m of metiers) {
      if (!metiersWithPros.has(m.slug)) continue;
      urls.push({ loc: `/${m.slug}/`, priority: 0.8, changefreq: "weekly", lastmod: now });
    }

    // /[metier]/[departement]/ , seulement les combos réels
    const zoneBySlug = new Map(zones.map((z) => [z.slug, z]));
    for (const combo of combos) {
      const [metierSlug, deptSlug] = combo.split(":");
      if (!zoneBySlug.has(deptSlug)) continue;
      urls.push({
        loc: `/${metierSlug}/${deptSlug}/`,
        priority: 0.85,
        changefreq: "weekly",
        lastmod: now,
      });
    }
  } catch (e) {
    console.warn("Sitemap: failed to fetch metiers/combos, fallback to pilotes", e);
    // Fallback en cas d'erreur DB : pilote historique (5×3)
    for (const m of siteConfig.metiersPilote) {
      urls.push({ loc: `/${m.slug}/`, priority: 0.8, changefreq: "weekly", lastmod: now });
    }
    for (const m of siteConfig.metiersPilote) {
      for (const d of siteConfig.departementsPilote) {
        urls.push({ loc: `/${m.slug}/${d.slug}/`, priority: 0.85, changefreq: "weekly", lastmod: now });
      }
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

  // URLs pros , wave1 SSG whitelist (synchro avec /pro/[slug] getStaticPaths).
  // Le long-tail est expose via sitemap-pros-ext-N.xml (declares dans
  // sitemap-index.xml et servis en SSR par site/functions/pro/[[slug]].ts).
  try {
    const wave1Set = new Set(wave1Pros as string[]);
    const wave1Slugs = Array.from(wave1Set);
    const lastmodBySlug: Record<string, string> = {};
    const page = 1000;
    for (let start = 0; ; start += page) {
      const { data: batch, error } = await supabase
        .from("pros")
        .select("slug, updated_at")
        .eq("active", true)
        .not("slug", "is", null)
        .range(start, start + page - 1);
      if (error || !batch || batch.length === 0) break;
      for (const p of batch) {
        if (p.slug && wave1Set.has(p.slug)) {
          lastmodBySlug[p.slug] = p.updated_at ? p.updated_at.split("T")[0] : now;
        }
      }
      if (batch.length < page) break;
    }
    for (const slug of wave1Slugs) {
      urls.push({
        loc: `/pro/${slug}/`,
        priority: 0.6,
        changefreq: "monthly",
        lastmod: lastmodBySlug[slug] || now,
      });
    }
  } catch (e) {
    console.warn("Sitemap: failed to fetch pros, falling back to wave1 only", e);
    for (const slug of wave1Pros as string[]) {
      urls.push({ loc: `/pro/${slug}/`, priority: 0.6, changefreq: "monthly", lastmod: now });
    }
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
