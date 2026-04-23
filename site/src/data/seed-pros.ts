/**
 * Seed de démarrage , 15 pros fictifs/illustratifs couvrant le pilote (5 métiers × 3 dépts).
 * Sera remplacé par les données Supabase Sirene après le premier import.
 */

export interface ProSeed {
  slug: string;
  nom: string;
  metier: string; // slug
  ville: string;
  departement: string; // slug dept ex "yonne-89"
  codePostal: string;
  rank: number;
  score: number;
  tier: "or" | "argent" | "gratuit";
  ancienneteAnnees: number;
  salaries?: number;
  siretMasque?: string;
  specialites: string[];
  rge: boolean;
  qualibat: boolean;
  telephoneVisible?: boolean;
  siteWeb?: string;
  resumeCourt: string;
  portrait?: string;
  citation?: { text: string; auteur: string };
  avisMoyen?: number;
  avisNombre?: number;
}

export const prosSeed: ProSeed[] = [
  // PLOMBIER , YONNE (89)
  {
    slug: "dubois-fils-plomberie-générale",
    nom: "Dubois & Fils",
    metier: "plombier",
    ville: "Auxerre",
    departement: "yonne-89",
    codePostal: "89000",
    rank: 1,
    score: 9.4,
    tier: "or",
    ancienneteAnnees: 42,
    salaries: 12,
    specialites: ["Reseaux anciens", "Depannage urgence", "Salles de bain"],
    rge: true, qualibat: true,
    siteWeb: "https://dubois-plomberie.fr",
    resumeCourt: "Entreprise familiale de plomberie générale, quatre generations d'artisans, deux compagnons du devoir, trois apprentis.",
    portrait: "Entreprise familiale de plomberie générale basee a Auxerre depuis 1984. Specialisee en renovation de réseaux anciens et depannage d'urgence dans l'Yonne. Certifiee RGE et Qualibat depuis 2011.",
    citation: {
      text: "Nous refusons un chantier sur trois. Cela etonne les clients. Mais refuser, c'est aussi protéger la reputation qu'on a mise quarante ans a construire.",
      auteur: "Jean-Paul Dubois, gerant",
    },
    avisMoyen: 4.7, avisNombre: 132,
  },
  {
    slug: "lefevre-thermique",
    nom: "Lefevre Thermique",
    metier: "plombier",
    ville: "Sens",
    departement: "yonne-89",
    codePostal: "89100",
    rank: 2,
    score: 9.1,
    tier: "argent",
    ancienneteAnnees: 22,
    specialites: ["Chaudieres gaz", "Pompes a chaleur", "Sanitaires"],
    rge: true, qualibat: false,
    resumeCourt: "Specialiste PAC et chaudieres gaz a condensation, certifié RGE depuis 2014.",
    avisMoyen: 4.5, avisNombre: 89,
  },
  {
    slug: "sarl-martin-plombier",
    nom: "SARL Martin",
    metier: "plombier",
    ville: "Joigny",
    departement: "yonne-89",
    codePostal: "89300",
    rank: 3,
    score: 8.7,
    tier: "gratuit",
    ancienneteAnnees: 18,
    specialites: ["Depannage", "Pose sanitaires"],
    rge: false, qualibat: true,
    resumeCourt: "Artisan installe depuis 2008, qualification Qualibat confirmee.",
    avisMoyen: 4.3, avisNombre: 47,
  },

  // ELECTRICIEN , YONNE
  {
    slug: "atelier-volts-auxerre",
    nom: "Atelier Volts",
    metier: "electricien",
    ville: "Auxerre",
    departement: "yonne-89",
    codePostal: "89000",
    rank: 1,
    score: 9.3,
    tier: "or",
    ancienneteAnnees: 31,
    salaries: 8,
    specialites: ["Renovation complete", "Domotique", "Tertiaire"],
    rge: true, qualibat: true,
    siteWeb: "https://atelier-volts.fr",
    resumeCourt: "Entreprise artisanale reconnue pour ses renovations electriques completes et son savoir-faire en domotique.",
    avisMoyen: 4.8, avisNombre: 176,
  },
  {
    slug: "lumiere-yonne",
    nom: "Lumiere Yonne SARL",
    metier: "electricien",
    ville: "Avallon",
    departement: "yonne-89",
    codePostal: "89200",
    rank: 2,
    score: 8.8,
    tier: "argent",
    ancienneteAnnees: 17,
    specialites: ["Eclairage design", "Tableaux electriques"],
    rge: true, qualibat: false,
    resumeCourt: "Specialiste eclairage et tableaux aux normes 2025 dans le sud Yonne.",
    avisMoyen: 4.4, avisNombre: 62,
  },

  // COUVREUR , YONNE
  {
    slug: "toitures-bourgogne",
    nom: "Toitures de Bourgogne",
    metier: "couvreur",
    ville: "Chablis",
    departement: "yonne-89",
    codePostal: "89800",
    rank: 1,
    score: 9.0,
    tier: "argent",
    ancienneteAnnees: 28,
    specialites: ["Ardoise", "Tuile bourguignonne", "Zinguerie"],
    rge: true, qualibat: true,
    siteWeb: "https://toitures-bourgogne.fr",
    resumeCourt: "Couverture traditionnelle et restauration de toitures de caractere dans l'Yonne et la Cote-d'Or.",
    avisMoyen: 4.6, avisNombre: 83,
  },

  // MENUISIER , COTE-D'OR (21)
  {
    slug: "atelier-maurel-menuiserie",
    nom: "Atelier Maurel",
    metier: "menuisier",
    ville: "Dijon",
    departement: "cote-dor-21",
    codePostal: "21000",
    rank: 1,
    score: 9.5,
    tier: "or",
    ancienneteAnnees: 52,
    salaries: 9,
    specialites: ["Menuiserie d'art", "Escaliers sur mesure", "Restauration patrimoine"],
    rge: false, qualibat: true,
    siteWeb: "https://atelier-maurel.fr",
    resumeCourt: "Atelier de menuiserie d'art, quatre generations, deux compagnons du devoir, nombreuses realisations classees monument historique.",
    portrait: "L'Atelier Maurel, base a Dijon depuis 1974, reunit quatre generations de menuisiers et deux compagnons du devoir. Specialise dans les escaliers sur mesure, la menuiserie d'art et la restauration de patrimoine en Bourgogne.",
    citation: {
      text: "Le bois garde la memoire des mains qui l'ont travaille. Notre responsabilite d'artisan, c'est de laisser des ouvrages qui durent plus que leurs auteurs.",
      auteur: "Victor Maurel, gerant",
    },
    avisMoyen: 4.9, avisNombre: 94,
  },
  {
    slug: "menuiserie-canal-bourgogne",
    nom: "Menuiserie du Canal",
    metier: "menuisier",
    ville: "Beaune",
    departement: "cote-dor-21",
    codePostal: "21200",
    rank: 2,
    score: 8.9,
    tier: "argent",
    ancienneteAnnees: 24,
    specialites: ["Fenetres bois", "Parquets", "Amenagement interieur"],
    rge: true, qualibat: false,
    resumeCourt: "Fabricant artisanal de fenetres bois et parquets, atelier près de Beaune.",
    avisMoyen: 4.5, avisNombre: 58,
  },

  // ISOLATION , YONNE
  {
    slug: "econaergie-isolation",
    nom: "EcoEnergie Isolation",
    metier: "isolation",
    ville: "Auxerre",
    departement: "yonne-89",
    codePostal: "89000",
    rank: 1,
    score: 9.2,
    tier: "or",
    ancienneteAnnees: 14,
    specialites: ["ITE", "Combles perdus", "MaPrimeRenov'"],
    rge: true, qualibat: true,
    siteWeb: "https://ecoenergie-isolation.fr",
    resumeCourt: "Entreprise d'isolation certifiée RGE Qualibat depuis 2012, spécialisée ITE et combles perdus, accompagnement MaPrimeRenov' complet.",
    avisMoyen: 4.7, avisNombre: 104,
  },

  // PLOMBIER , PARIS (75)
  {
    slug: "plomberie-haussmann-paris",
    nom: "Plomberie Haussmann",
    metier: "plombier",
    ville: "Paris 9e",
    departement: "paris-75",
    codePostal: "75009",
    rank: 1,
    score: 9.3,
    tier: "or",
    ancienneteAnnees: 38,
    salaries: 15,
    specialites: ["Immeubles haussmanniens", "Copropriete", "Urgence 24h"],
    rge: false, qualibat: true,
    siteWeb: "https://plomberie-haussmann.paris",
    resumeCourt: "Specialiste des plomberies d'immeubles haussmanniens parisiens, interventions urgence 24h en copropriete.",
    avisMoyen: 4.6, avisNombre: 241,
  },
  {
    slug: "atelier-tuyau-paris",
    nom: "Atelier Tuyau",
    metier: "plombier",
    ville: "Paris 11e",
    departement: "paris-75",
    codePostal: "75011",
    rank: 2,
    score: 8.9,
    tier: "argent",
    ancienneteAnnees: 21,
    specialites: ["Salles de bain design", "Renovation chauffage"],
    rge: true, qualibat: true,
    resumeCourt: "Artisan spécialisé dans les salles de bain design et la renovation de chauffage collectif.",
    avisMoyen: 4.5, avisNombre: 132,
  },

  // ELECTRICIEN , PARIS
  {
    slug: "paris-volts-11e",
    nom: "Paris Volts",
    metier: "electricien",
    ville: "Paris 11e",
    departement: "paris-75",
    codePostal: "75011",
    rank: 1,
    score: 9.0,
    tier: "or",
    ancienneteAnnees: 19,
    salaries: 11,
    specialites: ["Immeubles de bureaux", "Renovation copropriete", "Urgence"],
    rge: true, qualibat: true,
    resumeCourt: "Entreprise d'electricite tertiaire et residentielle, specialiste renovation de copropriete parisienne.",
    avisMoyen: 4.5, avisNombre: 218,
  },

  // COUVREUR , COTE-D'OR
  {
    slug: "couverture-bourguignonne",
    nom: "Couverture Bourguignonne",
    metier: "couvreur",
    ville: "Dijon",
    departement: "cote-dor-21",
    codePostal: "21000",
    rank: 1,
    score: 8.8,
    tier: "argent",
    ancienneteAnnees: 26,
    specialites: ["Tuile bourguignonne", "Zinguerie", "Patrimoine"],
    rge: true, qualibat: true,
    resumeCourt: "Couvreur traditionnel spécialisé dans la restauration de toitures patrimoniales en Cote-d'Or.",
    avisMoyen: 4.4, avisNombre: 71,
  },

  // ISOLATION , COTE-D'OR
  {
    slug: "isolation-21",
    nom: "Isolation 21",
    metier: "isolation",
    ville: "Dijon",
    departement: "cote-dor-21",
    codePostal: "21000",
    rank: 1,
    score: 8.7,
    tier: "gratuit",
    ancienneteAnnees: 11,
    specialites: ["Combles", "ITE", "Cellulose"],
    rge: true, qualibat: false,
    resumeCourt: "Jeune entreprise d'isolation RGE spécialisée combles perdus et ITE en Cote-d'Or.",
    avisMoyen: 4.3, avisNombre: 54,
  },
];

export function prosByMetierDept(metier: string, deptSlug: string): ProSeed[] {
  return prosSeed
    .filter((p) => p.metier === metier && p.departement === deptSlug)
    .sort((a, b) => a.rank - b.rank);
}

export function prosByMetier(metier: string): ProSeed[] {
  return prosSeed.filter((p) => p.metier === metier).sort((a, b) => b.score - a.score);
}

export function proBySlug(slug: string): ProSeed | undefined {
  return prosSeed.find((p) => p.slug === slug);
}

export function countProsByMetierDept(metier: string, deptSlug: string): number {
  return prosSeed.filter((p) => p.metier === metier && p.departement === deptSlug).length;
}
