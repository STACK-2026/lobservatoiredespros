/**
 * OG image dynamique par fiche pro.
 * SSG sur la wave1 whitelist (~15 800 PNGs au build), pour rester sous le cap
 * CF Pages 20 000 files. Les pros hors wave1 fallback sur l'OG default.
 *
 * Pattern aligné sur expert-menuiserie + adapte-toi : satori+resvg via le
 * helper renderOgPng() de lib/og.ts.
 */
import type { APIRoute } from "astro";
import { renderOgPng } from "../../../lib/og";
import { supabase, getTopOgSlugs, OG_PRO_CAP } from "../../../lib/supabase";
import { siteConfig } from "../../../utils/config";
import wave1Pros from "../../../data/wave1_pros.json";

interface ProForOg {
  slug: string;
  nom_entreprise: string;
  ville: string | null;
  rge: boolean;
  qualibat: boolean;
  niveau_confiance: string | null;
  date_creation_entreprise: string | null;
  score_confiance: number | null;
  metierLabel?: string;
}

export async function getStaticPaths() {
  const wave1Set = new Set(wave1Pros as string[]);
  const topOgSet = await getTopOgSlugs(OG_PRO_CAP, wave1Set);

  const page = 1000;
  const pros: ProForOg[] = [];
  for (let start = 0; ; start += page) {
    const { data, error } = await supabase
      .from("pros")
      .select("slug, nom_entreprise, ville, rge, qualibat, niveau_confiance, date_creation_entreprise, score_confiance")
      .eq("active", true)
      .not("slug", "is", null)
      .order("id")
      .range(start, start + page - 1);
    if (error) {
      console.error("og/pro/[slug] pros fetch error", error);
      break;
    }
    if (!data || data.length === 0) break;
    for (const p of data) {
      if (p.slug && topOgSet.has(p.slug)) pros.push(p as ProForOg);
    }
    if (data.length < page) break;
  }
  console.log(`[og/pro/[slug]] generating ${pros.length} OG PNGs (top ${OG_PRO_CAP} wave1 by score_confiance)`);

  return pros.map((p) => ({
    params: { slug: p.slug },
    props: { pro: p },
  }));
}

function tierLabel(niveau: string | null | undefined): { label: string; variant: "or" | "observatoire" | "cachet" | "ghost" } | null {
  if (!niveau) return null;
  if (niveau === "or") return { label: "Médaille d'Or", variant: "or" };
  if (niveau === "argent") return { label: "Médaille d'Argent", variant: "observatoire" };
  if (niveau === "bronze") return { label: "Niveau Bronze", variant: "ghost" };
  if (niveau === "platine") return { label: "Médaille Platine", variant: "or" };
  return null;
}

function ageYears(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const years = diff / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years);
}

export const GET: APIRoute = async ({ props }) => {
  const { pro } = props as { pro: ProForOg };
  const tier = tierLabel(pro.niveau_confiance);
  const age = ageYears(pro.date_creation_entreprise);

  const pills: { label: string; variant?: "or" | "observatoire" | "cachet" | "ghost" }[] = [];
  if (tier) pills.push(tier);
  if (pro.rge) pills.push({ label: "RGE certifié", variant: "or" });
  if (pro.qualibat) pills.push({ label: "Qualibat", variant: "observatoire" });
  if (age !== null && age >= 3) pills.push({ label: `${age} ans`, variant: "ghost" });

  const subtitle = pro.ville
    ? `Fiche éditoriale · ${pro.ville} · sources INSEE, ADEME, BODACC.`
    : `Fiche éditoriale · sources INSEE, ADEME, BODACC.`;

  const png = await renderOgPng({
    kicker: `Édition N°${siteConfig.editionNumber} · Portrait`,
    title: pro.nom_entreprise,
    subtitle,
    pills,
  });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
