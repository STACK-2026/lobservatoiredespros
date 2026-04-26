import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { supabase, getMetiers, getZones, getMetierDeptCombos } from "../lib/supabase";
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

  // URLs pros , uniquement les TOP 10 par combo (metier x dpt) pour matcher
  // les pages statiques generees par /pro/[slug]. Sinon on liste 100k URLs
  // dont 90k sont 404 = mauvais signal SEO.
  try {
    const { getAllProMetiers, getAllProZones } = await import("../lib/supabase");
    const allProMetiers = await getAllProMetiers();
    const allProZones = await getAllProZones();

    // Fetch toutes les infos pros minimal
    const allProsLite: Array<{ id: string; slug: string; score: number; updated_at: string | null }> = [];
    const page = 1000;
    for (let start = 0; ; start += page) {
      const { data: batch, error } = await supabase
        .from("pros")
        .select("id, slug, score_confiance, updated_at")
        .eq("active", true)
        .not("slug", "is", null)
        .range(start, start + page - 1);
      if (error || !batch || batch.length === 0) break;
      for (const p of batch) {
        allProsLite.push({
          id: p.id,
          slug: p.slug,
          score: p.score_confiance || 0,
          updated_at: p.updated_at,
        });
      }
      if (batch.length < page) break;
    }
    const proById = Object.fromEntries(allProsLite.map((p) => [p.id, p]));

    // Build combo -> list pros, prendre top 10 par score
    const zonesByPro: Record<string, string[]> = {};
    for (const pz of allProZones) {
      if (!zonesByPro[pz.pro_id]) zonesByPro[pz.pro_id] = [];
      zonesByPro[pz.pro_id].push(pz.zone_id);
    }
    const combos: Record<string, string[]> = {};
    for (const pm of allProMetiers) {
      for (const zid of zonesByPro[pm.pro_id] || []) {
        const key = `${pm.metier_id}:${zid}`;
        if (!combos[key]) combos[key] = [];
        combos[key].push(pm.pro_id);
      }
    }
    const topProIds = new Set<string>();
    for (const proIds of Object.values(combos)) {
      const top = proIds
        .filter((pid) => proById[pid])
        .sort((a, b) => proById[b].score - proById[a].score)
        .slice(0, 10);
      for (const pid of top) topProIds.add(pid);
    }

    for (const p of allProsLite) {
      if (!topProIds.has(p.id)) continue;
      urls.push({
        loc: `/pro/${p.slug}/`,
        priority: 0.6,
        changefreq: "monthly",
        lastmod: p.updated_at ? p.updated_at.split("T")[0] : now,
      });
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
