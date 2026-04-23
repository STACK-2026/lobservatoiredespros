/**
 * Redaction , profils des journalistes/analystes de L'Observatoire.
 *
 * Signal E-E-A-T fort : chaque auteur a une bio detaillee, un parcours,
 * une specialite editoriale et une page individuelle listant ses signatures.
 */

export interface Auteur {
  slug: string;
  nom: string;
  role: string;
  titre: string;
  intro: string;
  bio: string;
  parcours: { annee: string; detail: string }[];
  specialites: string[];
  principes: string[];
  articles_slugs: string[]; // slugs des observations signees
  contact_email?: string;
  photo_initials: string; // Monogramme stylise
  couleur_accent: "or" | "observatoire" | "cachet";
}

export const redaction: Auteur[] = [
  {
    slug: "camille-fabre",
    nom: "Camille Fabre",
    role: "Rédactrice en chef",
    titre: "Responsable des enquêtes et du classement éditorial",
    intro:
      "Journaliste spécialisée dans les marchés artisanaux et les certifications professionnelles, Camille Fabre dirige la rédaction de L'Observatoire depuis sa création.",
    bio:
      "Camille Fabre a commencé sa carrière en 2014 comme pigiste pour Le Moniteur, où elle a couvert pendant six ans les questions de qualification dans le BTP et les dérives du démarchage énergétique. En 2021, elle rejoint la cellule investigation d'un quotidien régional, signe une série sur les mentions RGE contestables qui vaudra à l'éditeur trois mises en demeure et autant de rétractations avant publication. Elle fonde L'Observatoire des Pros en 2026 avec la conviction qu'aucun média français ne tient un travail sérieux sur la vérification des artisans, à l'échelle. Elle garde du journalisme d'enquête le goût des sources croisées, la méfiance des classements promotionnels et l'habitude de citer tout ce qui est citable.",
    parcours: [
      { annee: "2014", detail: "Premiers papiers sur les fraudes RGE dans Le Moniteur." },
      { annee: "2017", detail: "Prix de la meilleure enquête régionale , dossier démarchage photovoltaïque." },
      { annee: "2021", detail: "Cellule investigation , quotidien régional." },
      { annee: "2026", detail: "Fonde L'Observatoire des Pros." },
    ],
    specialites: [
      "Enquêtes sur les dérives commerciales du BTP",
      "Vérification des certifications publiques",
      "Analyse de pratiques commerciales trompeuses",
      "Journalisme de données open source",
    ],
    principes: [
      "Citer ses sources à chaque affirmation chiffrée.",
      "Croiser au minimum trois sources indépendantes avant publication.",
      "Jamais de contrepartie commerciale d'une entreprise mentionnée.",
      "Droit de réponse systématiquement accordé sous sept jours ouvrés.",
    ],
    articles_slugs: ["enquete-rge-yonne-412-sites"],
    contact_email: "camille@send.lobservatoiredespros.com",
    photo_initials: "CF",
    couleur_accent: "cachet",
  },
  {
    slug: "antoine-delaunay",
    nom: "Antoine Delaunay",
    role: "Analyste méthodologie",
    titre: "Responsable de la grille d'analyse et du Score de Confiance",
    intro:
      "Statisticien formé aux sciences sociales, Antoine Delaunay conçoit et documente la méthode de scoring qui fonde chaque classement de L'Observatoire.",
    bio:
      "Diplômé de l'École des Hautes Études en Sciences Sociales, Antoine Delaunay a passé six ans à l'INSEE comme chargé d'études sur les secteurs d'activité des petites entreprises. Il a contribué aux rapports annuels sur la démographie artisanale et a publié plusieurs notes méthodologiques sur l'exploitation des données Sirene à des fins de classement public. Il rejoint L'Observatoire à sa fondation pour concevoir la grille à six critères qui structure chaque édition. Sa conviction : un score éditorial n'a de valeur que si la méthode est entièrement publiée, reproductible, et auditable par un tiers. C'est cette rigueur qui distingue un classement de presse d'un annuaire commercial.",
    parcours: [
      { annee: "2016", detail: "Diplôme EHESS , économie des petites entreprises." },
      { annee: "2017", detail: "Chargé d'études INSEE , Service de démographie des entreprises." },
      { annee: "2023", detail: "Contribution aux rapports nationaux sur l'artisanat." },
      { annee: "2026", detail: "Rejoint L'Observatoire comme analyste méthodologie." },
    ],
    specialites: [
      "Exploitation des registres Sirene",
      "Scoring multi-critères transparent",
      "Validation statistique de classements",
      "Rédaction méthodologique auditable",
    ],
    principes: [
      "Toute méthode doit être publique avant son application.",
      "Un critère non auditable n'entre pas dans le score.",
      "Rééquilibrer les pondérations au moins une fois par an, expliquer publiquement.",
      "Ne jamais ajuster un score a posteriori pour accommoder un sujet.",
    ],
    articles_slugs: ["methodologie-score-confiance-etoiles"],
    contact_email: "antoine@send.lobservatoiredespros.com",
    photo_initials: "AD",
    couleur_accent: "observatoire",
  },
  {
    slug: "sarah-poitevin",
    nom: "Sarah Poitevin",
    role: "Portraits & terrain",
    titre: "Responsable des portraits Lauréat et des reportages de terrain",
    intro:
      "Reporter de terrain, Sarah Poitevin rédige les portraits Lauréat de chaque édition après un entretien approfondi avec le dirigeant et une vérification physique d'au moins une réalisation récente.",
    bio:
      "Sarah Poitevin a commencé comme localière dans un hebdomadaire de Bourgogne, où elle a couvert pendant cinq ans les chantiers, les artisans, les petits drames et les réussites d'un territoire. Elle a toujours préféré les ateliers aux conférences de presse, et croit que le journalisme sur les métiers manuels passe par la main tendue et l'oreille patiente. Sur chaque dossier Lauréat, elle se déplace au moins une fois, interroge au minimum trois clients finaux et relit son papier avec le principal intéressé avant publication. Les portraits qu'elle signe ont un ton particulier : ni promotionnel ni surplombant, juste précis. C'est, dans la rédaction, la ligne qu'elle défend le plus fermement.",
    parcours: [
      { annee: "2015", detail: "Débuts dans l'hebdomadaire de Bourgogne, rubrique économie locale." },
      { annee: "2019", detail: "Série documentaire sur les compagnons du devoir." },
      { annee: "2022", detail: "Reportages primés sur la transmission d'entreprises familiales." },
      { annee: "2026", detail: "Rejoint L'Observatoire comme responsable des portraits Lauréat." },
    ],
    specialites: [
      "Reportages de terrain dans les ateliers artisanaux",
      "Entretiens longs avec des dirigeants de TPE-PME",
      "Portraits Lauréat et vérifications sur place",
      "Mémoire des savoirs manuels et transmission",
    ],
    principes: [
      "Pas de portrait sans visite physique de l'atelier.",
      "Au moins trois clients finaux interrogés avant publication.",
      "Le sujet relit le papier avant publication, mais ne le réécrit pas.",
      "Ni promotion ni surplomb : ton précis, vérifié, honnête.",
    ],
    articles_slugs: ["portrait-atelier-maurel-dijon"],
    contact_email: "sarah@send.lobservatoiredespros.com",
    photo_initials: "SP",
    couleur_accent: "or",
  },
];

export function auteurBySlug(slug: string): Auteur | undefined {
  return redaction.find((a) => a.slug === slug);
}
