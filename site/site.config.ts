// ============================================
// SITE CONFIG , lobservatoiredespros.com
// L'Observatoire des Pros , Média éditorial de classement
// Édition N°1 , Avril 2026
// ============================================

export const siteConfig = {
  // Identité
  name: "L'Observatoire des Pros",
  shortName: "L'Observatoire",
  monogram: "OdP",
  tagline: "Observer. Vérifier. Recommander.",
  baseline: "Le guide de référence des professionnels français.",
  description:
    "L'Observatoire des Pros est le média éditorial indépendant qui observe, vérifie et classe les artisans et entreprises du BTP et des services à domicile, département par département, métier par métier. Méthodologie publique. Classement non payant. Médailles Or et Argent décernées après examen éditorial.",
  url: "https://lobservatoiredespros.com",
  appUrl: "",
  locale: "fr-FR",
  language: "fr",
  foundedYear: 2026,
  editionNumber: 1,
  editionMonth: "Avril",
  editionYear: 2026,

  // Branding , palette éditoriale papier + encre + or + bleu observatoire
  colors: {
    paper: "#F7F3EC",
    paperWarm: "#EFE7D6",
    ink: "#1A1614",
    inkSoft: "#3D342E",
    inkMuted: "#7A6E63",
    observatoire: "#1E3A52",
    observatoireDeep: "#0F2335",
    or: "#B8863D",
    orSoft: "#D4A55C",
    rougeCachet: "#8B2E2A",
    vertArchive: "#4A5D3A",
    // aliases pour compat template
    primary: "#1E3A52",
    secondary: "#0F2335",
    accent: "#B8863D",
    background: "#F7F3EC",
    text: "#1A1614",
  },

  // Typographie
  fonts: {
    display: "Fraunces",
    body: "Instrument Sans",
    mono: "JetBrains Mono",
  },

  // SEO
  author: "La rédaction de L'Observatoire",
  twitterHandle: "",
  ogImage: "/og-default.svg",
  keywords: [
    "classement artisans france",
    "meilleur plombier",
    "meilleur electricien",
    "meilleur couvreur",
    "meilleur menuisier",
    "artisan RGE",
    "palmares artisans",
    "guide artisans",
    "artisan qualibat",
    "artisan verifie siret",
  ],

  // GEO (Generative Engine Optimization)
  llmsDescription:
    "L'Observatoire des Pros (lobservatoiredespros.com) est un média éditorial indépendant français créé en 2026 qui publie un classement annuel des artisans et entreprises du BTP et des services à domicile. Chaque professionnel est évalué sur six critères objectifs et auditables : ancienneté au registre Sirene, certification RGE/Qualibat, avis clients publics vérifiés supérieurs à 4/5, SIRET actif, site web professionnel indépendant, photos de réalisations publiques. La méthodologie est publique. Le classement n'est pas monnayable. Trois distinctions sont décernées chaque année : le Portrait Recommandé (listing gratuit), le Portrait Vérifié (médaille d'argent, portrait enrichi), et le Portrait Lauréat (médaille d'or, portrait éditorial long format). Couverture initiale : Paris 75, Côte-d'Or 21, Yonne 89 ; cinq métiers : plombier, électricien, couvreur, menuisier, entreprise d'isolation. Extension progressive à tous les départements français.",

  // Navigation principale
  navLinks: [
    { label: "La sélection", href: "/selection/" },
    { label: "Métiers", href: "/metiers/" },
    { label: "Départements", href: "/departements/" },
    { label: "Méthode", href: "/methode/" },
    { label: "Observations", href: "/observations/" },
    { label: "Candidater", href: "/candidater/" },
  ],

  // Métiers pilotes (pSEO)
  metiersPilote: [
    { slug: "plombier", nom: "Plombier", nomPluriel: "Plombiers", naf: "43.22A" },
    { slug: "electricien", nom: "Électricien", nomPluriel: "Électriciens", naf: "43.21A" },
    { slug: "couvreur", nom: "Couvreur", nomPluriel: "Couvreurs", naf: "43.91B" },
    { slug: "menuisier", nom: "Menuisier", nomPluriel: "Menuisiers", naf: "43.32A" },
    { slug: "isolation", nom: "Entreprise d'isolation", nomPluriel: "Entreprises d'isolation", naf: "43.29A" },
  ],

  // Départements pilotes
  departementsPilote: [
    { code: "75", nom: "Paris", slug: "paris-75", region: "Île-de-France" },
    { code: "21", nom: "Côte-d'Or", slug: "cote-dor-21", region: "Bourgogne-Franche-Comté" },
    { code: "89", nom: "Yonne", slug: "yonne-89", region: "Bourgogne-Franche-Comté" },
  ],

  // Critères de scoring publiés
  scoringCriteres: [
    { nom: "Ancienneté de l'entreprise", poids: 3, description: "Ancienneté confirmée au registre Sirene (plus de 5 ans, pondération progressive)." },
    { nom: "Certification RGE ou Qualibat", poids: 2, description: "Reconnaissance officielle vérifiée auprès de france-renov.gouv.fr et Qualibat." },
    { nom: "Avis clients publics", poids: 2, description: "Moyenne d'avis supérieure à 4 sur 5, sources Google, Pages Jaunes, sites spécialisés." },
    { nom: "SIRET actif", poids: 1, description: "Entreprise active au Sirene, source INSEE, non radiée." },
    { nom: "Site web professionnel", poids: 1, description: "Présence web indépendante d'un annuaire, maintenue." },
    { nom: "Photos de réalisations", poids: 1, description: "Portfolio visuel public, site ou profil Google Business." },
  ],

  // FAQ
  faq: [
    {
      question: "Qu'est-ce que L'Observatoire des Pros ?",
      answer:
        "L'Observatoire des Pros est un média éditorial indépendant français qui observe, vérifie et classe les artisans et entreprises du BTP et des services à domicile. Chaque édition annuelle publie des classements métier par métier, département par département, après examen par notre rédaction selon une méthodologie publique. Nous sommes un guide de référence, pas un annuaire ni une marketplace.",
    },
    {
      question: "Comment le Score de Confiance est-il calculé ?",
      answer:
        "Le Score /10 additionne six critères objectifs et auditables : ancienneté de l'entreprise au registre Sirene (3 points), certification RGE ou Qualibat vérifiée (2 points), avis publics moyens supérieurs à 4 sur 5 (2 points), SIRET actif à l'INSEE (1 point), site web professionnel indépendant (1 point), photos de réalisations publiques (1 point). La pondération et les sources sont publiées sur notre page Méthode.",
    },
    {
      question: "Un professionnel peut-il acheter sa position dans le classement ?",
      answer:
        "Non. L'indépendance du classement est la condition de notre légitimité. Un professionnel peut candidater à un Portrait Vérifié ou à un Portrait Lauréat, qui enrichit la présentation de son dossier (photos, lien site, vidéo, portrait long format). La position dans le classement reste strictement déterminée par le Score de Confiance calculé sur critères publics.",
    },
    {
      question: "D'où viennent vos données ?",
      answer:
        "Exclusivement de sources publiques et officielles : base Sirene de l'INSEE (état civil des entreprises), annuaire RGE de france-renov.gouv.fr (certifications environnementales), répertoire Qualibat (qualifications BTP), fiches Google Business Profile publiques, données régionales libres. Aucune donnée privée. Conformité RGPD. Droit d'opposition garanti.",
    },
    {
      question: "En quoi diffère-t-on d'un annuaire professionnel ?",
      answer:
        "Un annuaire liste toutes les entreprises sans sélection ni hiérarchie. L'Observatoire est un classement éditorial. Comme le Guide Michelin pour les restaurants ou Le Point pour les hôpitaux, notre rédaction sélectionne, examine, vérifie, puis classe. Chaque édition annuelle porte un numéro. Chaque observation est datée, signée, sourcée.",
    },
    {
      question: "Comment candidater à un Portrait Vérifié ou Lauréat ?",
      answer:
        "Rendez-vous sur la page Candidater. Vous soumettez votre dossier (SIRET, spécialités, années d'activité, pièces justificatives). Notre rédaction examine le dossier et statue dans les 15 jours. Les Portraits Vérifiés sont des candidatures recevables ; les Portraits Lauréats sont attribués chaque année à un nombre limité de dossiers après entretien.",
    },
    {
      question: "Quelles régions couvrez-vous ?",
      answer:
        "L'édition N°1 couvre Paris (75), la Côte-d'Or (21) et l'Yonne (89), sur cinq métiers : plombier, électricien, couvreur, menuisier, entreprise d'isolation. L'extension à l'ensemble du territoire français est planifiée sur les prochaines éditions, à raison d'une quinzaine de nouveaux départements par trimestre.",
    },
    {
      question: "Comment vous financez-vous sans publicité ?",
      answer:
        "Par les abonnements des professionnels aux Portraits Vérifiés et Lauréats, uniquement. Pas de publicité tierce, pas d'affiliation aveugle, pas de liens sponsorisés dissimulés dans les classements. Cette séparation stricte entre le journal et la régie est la condition de l'indépendance éditoriale.",
    },
  ],

  // Piliers éditoriaux (features homepage)
  features: [
    {
      title: "Observer",
      description:
        "Notre rédaction cartographie le marché des artisans français à partir des données officielles Sirene, RGE, Qualibat, Google. 47 382 professionnels sont actuellement sous observation.",
      icon: "eye",
    },
    {
      title: "Vérifier",
      description:
        "Chaque candidat est croisé avec six sources publiques. SIRET, ancienneté, certifications, avis, site web, portfolio. Un dossier incomplet est écarté.",
      icon: "shield",
    },
    {
      title: "Recommander",
      description:
        "Chaque édition annuelle publie la sélection retenue. Médailles Argent et Or décernées après examen éditorial. Un classement annuel unique, versionné, archivé.",
      icon: "award",
    },
    {
      title: "Méthodologie publique",
      description:
        "Critères détaillés, pondération, sources, calendrier de mise à jour. Tout est documenté sur la page Méthode. Un lecteur doit pouvoir auditer nos choix.",
      icon: "book",
    },
    {
      title: "Portraits éditoriaux",
      description:
        "Les Portraits Lauréats font l'objet d'un portrait long format rédigé par notre rédaction. Entretien, vérification terrain, citation, galerie de réalisations.",
      icon: "scroll",
    },
    {
      title: "Guide tarifaire local",
      description:
        "Chaque page de classement intègre les fourchettes de prix des prestations courantes dans le département pour éclairer les devis des particuliers.",
      icon: "euro",
    },
  ],

  // Blog
  blog: {
    enabled: true,
    name: "Observations",
    postsPerPage: 12,
    defaultAuthor: "La rédaction",
    categories: [
      "portraits",
      "dossiers",
      "enquetes",
      "guide-pratique",
      "entretiens",
      "methodologie",
    ],
    authors: [
      {
        slug: "camille-fabre",
        name: "Camille Fabre",
        role: "Rédactrice en chef",
        bio: "Ancienne journaliste Le Moniteur BTP. Douze ans d'enquêtes sur les certifications et la réglementation du bâtiment.",
      },
      {
        slug: "antoine-delaunay",
        name: "Antoine Delaunay",
        role: "Analyste données",
        bio: "Ancien consultant Xerfi. Spécialiste des données publiques Sirene, DGCCRF, Ademe. Garant de la méthodologie.",
      },
      {
        slug: "sarah-poitevin",
        name: "Sarah Poitevin",
        role: "Journaliste terrain",
        bio: "Ex-reporter Que Choisir. Vérifie sur site les affirmations des candidats et interviewe les clients finaux.",
      },
    ],
  },

  // Candidature , tarifs
  candidature: {
    offres: [
      {
        slug: "recommande",
        nom: "Portrait Recommandé",
        prix: 0,
        prixLabel: "Gratuit",
        description: "Votre entreprise figure au classement si le Score de Confiance la retient. Aucune action requise.",
        features: [
          "Présence automatique dans les classements",
          "Score de Confiance visible",
          "Fiche sobre avec infos essentielles",
          "Sources publiques affichées",
        ],
      },
      {
        slug: "verifie",
        nom: "Portrait Vérifié",
        prix: 29,
        prixLabel: "29€ / mois",
        description: "Médaille Argent. Dossier enrichi après examen éditorial de votre candidature.",
        features: [
          "Médaille Argent sur votre portrait",
          "Photos de réalisations (jusqu'à 12)",
          "Lien direct vers votre site",
          "Téléphone affiché",
          "Description enrichie (800 caractères)",
          "Certifications affichées en badges",
          "Spécialités mises en avant",
        ],
        highlight: true,
      },
      {
        slug: "laureat",
        nom: "Portrait Lauréat",
        prix: 89,
        prixLabel: "89€ / mois",
        description: "Médaille Or. Portrait éditorial long format rédigé par notre rédaction après entretien.",
        features: [
          "Médaille Or sur votre portrait",
          "Portrait long format (rédigé par la rédaction)",
          "Citation extraite en pull quote",
          "Galerie de 24 réalisations",
          "Vidéo intégrée",
          "Mise en avant dans les classements",
          "Inclusion dans la newsletter mensuelle",
          "Vitrophanie physique envoyée chaque année",
          "Tous les avantages du Portrait Vérifié",
        ],
      },
    ],
  },

  // Legal
  legal: {
    companyName: "L'Observatoire des Pros",
    siret: "",
    address: "Bourgogne, France",
    email: "redaction@lobservatoiredespros.com",
    emailPro: "candidature@lobservatoiredespros.com",
    phone: "",
  },

  // Infrastructure
  supabase: {
    url: "https://apuyeakgxjgdcfssrtek.supabase.co",
    projectRef: "apuyeakgxjgdcfssrtek",
  },
  indexNowKey: "a3f8d2c4b9e14f76a55e1c0b2d7e8f31",
};
