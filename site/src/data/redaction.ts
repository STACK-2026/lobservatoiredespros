/**
 * Signature éditoriale institutionnelle.
 *
 * Les contenus restent attribués à l'équipe tant qu'une identité individuelle
 * et son expérience ne peuvent pas être documentées publiquement.
 */

export interface Auteur {
  slug: string;
  nom: string;
  role: string;
  intro: string;
  articles_slugs: string[];
}

export const redaction: Auteur[] = [
  {
    slug: "redaction",
    nom: "La rédaction de L'Observatoire",
    role: "Équipe éditoriale",
    intro:
      "Signature institutionnelle des contenus préparés à partir des sources publiques et de la méthode documentée par L'Observatoire.",
    articles_slugs: [
      "verifier-artisan-avant-devis-4-controles-publics",
      "enquete-rge-yonne-412-sites",
      "methodologie-score-confiance-etoiles",
      "portrait-atelier-maurel-dijon",
    ],
  },
];

export function auteurBySlug(slug: string): Auteur | undefined {
  return redaction.find((a) => a.slug === slug);
}
