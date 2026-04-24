/**
 * OG image dynamique par article d'observations.
 * 1 PNG par article au build.
 */
import type { APIRoute } from "astro";
import { renderOgPng } from "../../../lib/og";
import { observations } from "../../../data/observations";
import { auteurBySlug } from "../../../data/redaction";
import { siteConfig } from "../../../utils/config";

export async function getStaticPaths() {
  return observations.map((o) => ({
    params: { slug: o.slug },
    props: { obs: o },
  }));
}

const CATEGORIE_LABEL: Record<string, string> = {
  enquete: "Enquête",
  methodologie: "Méthode",
  portrait: "Portrait",
  dossier: "Dossier",
  "guide-pratique": "Guide",
  entretien: "Entretien",
};

export const GET: APIRoute = async ({ props }) => {
  const { obs } = props as { obs: any };
  const auteur = auteurBySlug(obs.authorSlug);
  const cat = CATEGORIE_LABEL[obs.categorie] || obs.categorie;

  const dateFR = new Date(obs.datePublication).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pills = [
    { label: cat, variant: "cachet" as const },
    ...(auteur ? [{ label: auteur.nom, variant: "ghost" as const }] : []),
    { label: dateFR, variant: "ghost" as const },
    { label: `${obs.readingTime} min`, variant: "ghost" as const },
  ];

  const png = await renderOgPng({
    kicker: `Édition N°${siteConfig.editionNumber} · Observation`,
    title: obs.titre,
    subtitle: obs.sousTitre,
    pills,
  });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
