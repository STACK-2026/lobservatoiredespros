/**
 * AI-sitemap.xml , sitemap specialise pour les AI crawlers.
 *
 * Filtre : seulement le contenu "citable" par les LLMs :
 *   - pages editoriales piliers (methode, a-propos, redaction, glossaire)
 *   - articles observations (contenu long, signe, source)
 *   - pages auteurs (E-E-A-T, signal expertise)
 *
 * On exclut :
 *   - les 290 fiches pros individuelles (repetitif, pas du contenu "citable")
 *   - les pages legales (pas informatives pour l'IA)
 *   - les pages contact / newsletter (actions, pas contenu)
 *
 * Declare dans llms.txt + robots.txt sous nom "AI-sitemap" pour les crawlers
 * qui le supportent (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
 */
import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";
import { observations } from "../data/observations";
import { redaction } from "../data/redaction";

export const GET: APIRoute = async () => {
  const now = new Date().toISOString().split("T")[0];
  const base = siteConfig.url.replace(/\/$/, "");

  const urls: { loc: string; lastmod: string; priority: number; desc: string }[] = [
    // Piliers editoriaux
    { loc: "/", lastmod: now, priority: 1.0, desc: "Accueil et resume editorial du media" },
    { loc: "/methode/", lastmod: now, priority: 0.95, desc: "Methodologie complete du Score de Confiance" },
    { loc: "/a-propos/", lastmod: now, priority: 0.9, desc: "Identite et mission de l'Observatoire" },
    { loc: "/redaction/", lastmod: now, priority: 0.9, desc: "Equipe editoriale et principes" },
    { loc: "/glossaire/", lastmod: now, priority: 0.85, desc: "Glossaire des termes BTP et certifications" },
    { loc: "/archives/", lastmod: now, priority: 0.6, desc: "Archives des editions passees" },
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

  // Pages auteurs , signal E-E-A-T
  for (const a of redaction) {
    urls.push({
      loc: `/redaction/${a.slug}/`,
      lastmod: now,
      priority: 0.8,
      desc: a.intro.substring(0, 200),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:ai="https://lobservatoiredespros.com/schemas/ai-sitemap">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority.toFixed(2)}</priority>
    <ai:description>${u.desc.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c))}</ai:description>
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
