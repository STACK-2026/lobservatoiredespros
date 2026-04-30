/**
 * OG image dynamique par (métier × département).
 * SSG capped au top OG_CLASSEMENT_CAP combos par #pros pour rester sous
 * le plafond CF Pages 20 000 files. Hors top : OG default.
 */
import type { APIRoute } from "astro";
import { renderOgPng } from "../../../../lib/og";
import {
  getMetiers,
  getZones,
  getMetierDeptComboCounts,
  getProsByMetierDept,
  OG_CLASSEMENT_CAP,
} from "../../../../lib/supabase";
import { siteConfig } from "../../../../utils/config";
import { REGION_BY_DEPT_CODE } from "../../../../data/geo_fr";

export async function getStaticPaths() {
  const metiers = await getMetiers();
  const zones = await getZones("departement");
  const counts = await getMetierDeptComboCounts();
  const metierBySlug = new Map(metiers.map((m) => [m.slug, m]));
  const zoneBySlug = new Map(zones.map((z) => [z.slug, z]));

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, OG_CLASSEMENT_CAP);

  console.log(`[og/classement] generating ${ranked.length} OG PNGs (top ${OG_CLASSEMENT_CAP} combos by #pros)`);
  const paths = [];
  for (const [key] of ranked) {
    const [mSlug, zSlug] = key.split(":");
    const m = metierBySlug.get(mSlug);
    const z = zoneBySlug.get(zSlug);
    if (!m || !z) continue;
    paths.push({
      params: { metier: m.slug, dept: z.slug },
      props: { metier: m, zone: z },
    });
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
