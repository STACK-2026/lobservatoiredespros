/**
 * OG image dynamique par (métier × département).
 * 1 PNG par classement généré au build (~120 PNGs post-Phase 2.1 IDF).
 */
import type { APIRoute } from "astro";
import { renderOgPng } from "../../../../lib/og";
import {
  getMetiers,
  getZones,
  getMetierDeptCombos,
  getProsByMetierDept,
} from "../../../../lib/supabase";
import { siteConfig } from "../../../../utils/config";
import { REGION_BY_DEPT_CODE } from "../../../../data/geo_fr";

export async function getStaticPaths() {
  const metiers = await getMetiers();
  const zones = await getZones("departement");
  const combos = await getMetierDeptCombos();
  const paths = [];
  for (const m of metiers) {
    for (const z of zones) {
      if (!combos.has(`${m.slug}:${z.slug}`)) continue;
      paths.push({
        params: { metier: m.slug, dept: z.slug },
        props: { metier: m, zone: z },
      });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const { metier, zone } = props as {
    metier: { slug: string; nom: string; nom_pluriel: string };
    zone: { slug: string; nom: string; code: string };
  };

  const pros = await getProsByMetierDept(metier.slug, zone.slug);
  const rgeCount = pros.filter((p: any) => p.rge).length;
  const region = REGION_BY_DEPT_CODE[zone.code];

  const pills = [
    { label: `${pros.length} pros`, variant: "observatoire" as const },
    ...(rgeCount > 0
      ? [{ label: `${rgeCount} RGE`, variant: "or" as const }]
      : []),
    ...(region ? [{ label: region, variant: "ghost" as const }] : []),
  ];

  const title = `Les meilleurs ${metier.nom_pluriel.toLowerCase()} ${
    zone.nom === "Paris" ? "à Paris" : `dans ${zone.nom}`
  }.`;

  const subtitle = `Classement éditorial ${siteConfig.editionYear} · six critères publics · sources INSEE, ADEME, BODACC.`;

  const png = await renderOgPng({
    kicker: `Édition N°${siteConfig.editionNumber} · Classement`,
    title,
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
