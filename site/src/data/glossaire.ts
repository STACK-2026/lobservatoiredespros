/**
 * Glossaire , terminologie BTP et services a domicile.
 * Utilise pour la page /glossaire/ + tooltip inline AutoGlossaire.
 */
export interface TermeGlossaire {
  terme: string;
  slug: string;
  acronyme?: string;
  definition: string;
  developpement: string;
  source?: { label: string; url: string };
  categorie: "certification" | "reglementation" | "financement" | "technique" | "juridique";
  voirAussi?: string[];
}

export const glossaire: TermeGlossaire[] = [
  {
    terme: "RGE",
    slug: "rge",
    acronyme: "Reconnu Garant de l'Environnement",
    definition: "Mention officielle attribuee par l'État aux professionnels du batiment qualifies en renovation energetique.",
    developpement:
      "Obligatoire pour que les travaux soient eligibles aux aides publiques : MaPrimeRenov', TVA reduite a 5.5%, eco-pret a taux zero, Certificats d'Economie d'Energie (CEE). Delivree par des organismes certificateurs agrees (Qualibat, Qualifelec, Qualit'EnR, Cequami). Verifiable sur france-renov.gouv.fr.",
    source: { label: "France Renov", url: "https://france-renov.gouv.fr/annuaire-rge" },
    categorie: "certification",
    voirAussi: ["qualibat", "maprimerenov", "cee"],
  },
  {
    terme: "Qualibat",
    slug: "qualibat",
    definition: "Organisme certificateur français independant qui qualifie les entreprises de batiment sur des criteres techniques, administratifs et financiers.",
    developpement:
      "Plus de 45 000 entreprises qualifiees. La qualification Qualibat est un signal fort de sérieux : elle atteste que l'entreprise respecte les obligations sociales, fiscales, assurantielles, et possede les competences techniques documentees. Validee pour une durée limitee, renouvelee par audit.",
    source: { label: "Qualibat", url: "https://www.qualibat.com" },
    categorie: "certification",
    voirAussi: ["rge"],
  },
  {
    terme: "Sirene",
    slug: "sirene",
    acronyme: "Systeme Informatise du Repertoire National des Entreprises et des Etablissements",
    definition: "Repertoire officiel de l'INSEE qui recense toutes les entreprises françaises.",
    developpement:
      "Chaque entreprise recoit un SIREN (9 chiffres, identifiant juridique) et chaque etablissement un SIRET (14 chiffres = SIREN + 5 chiffres). Les données Sirene sont publiques et gratuites, consultables via recherche-entreprises.api.gouv.fr. L'Observatoire utilise Sirene comme source de verite pour l'anciennete et l'etat administratif des entreprises.",
    source: { label: "Sirene", url: "https://www.sirene.fr" },
    categorie: "juridique",
    voirAussi: ["naf"],
  },
  {
    terme: "SIRET",
    slug: "siret",
    definition: "Numero a 14 chiffres qui identifie de maniere unique un etablissement d'entreprise en France.",
    developpement:
      "Compose du SIREN (9 chiffres, entreprise juridique) + 5 chiffres identifiant l'etablissement (NIC). Un artisan installe peut avoir plusieurs SIRET si il opere depuis plusieurs lieux. L'etat administratif peut etre A (actif) ou C (cesse) , seules les entreprises actives figurent dans nos classements.",
    categorie: "juridique",
    voirAussi: ["sirene", "naf"],
  },
  {
    terme: "Code NAF",
    slug: "naf",
    acronyme: "Nomenclature d'Activites Française",
    definition: "Code a 5 caracteres qui classe l'activité principale d'une entreprise.",
    developpement:
      "Pour les metiers que nous couvrons : 43.22A (plomberie), 43.21A (installation electrique), 43.91B (travaux de couverture), 43.32A (travaux de menuiserie bois et PVC), 43.29A (autres travaux d'installation). Ce code est choisi par l'entreprise elle-meme, il peut etre imprecis. L'Observatoire le croise avec le libelle d'activité et les realisations effectives.",
    categorie: "juridique",
    voirAussi: ["sirene"],
  },
  {
    terme: "MaPrimeRenov'",
    slug: "maprimerenov",
    definition: "Aide de l'État versee aux particuliers pour financer des travaux de renovation energetique de leur logement principal.",
    developpement:
      "Lancee en 2020, elle remplace le Credit d'Impot Transition Energetique (CITE) et le programme Habiter Mieux Agilite. Montant module selon les revenus du foyer et la nature des travaux (isolation, chauffage, ventilation, audit energetique). Accessible uniquement via un professionnel RGE. Paiement au prestataire sur presentation de la facture.",
    source: { label: "ANAH , MaPrimeRenov", url: "https://www.maprimerenov.gouv.fr" },
    categorie: "financement",
    voirAussi: ["rge", "cee", "eco-ptz"],
  },
  {
    terme: "CEE",
    slug: "cee",
    acronyme: "Certificat d'Economie d'Energie",
    definition: "Dispositif qui oblige les fournisseurs d'energie (EDF, Engie, Total Energies) a financer des travaux d'economie d'energie chez leurs clients.",
    developpement:
      "Les CEE sont cumulables avec MaPrimeRenov'. Pris en charge directement par le fournisseur d'energie, ils deduisent le montant du devis du particulier. Les artisans RGE peuvent y orienter leurs clients. Les montants varient selon la nature des travaux et la zone climatique.",
    categorie: "financement",
    voirAussi: ["maprimerenov", "rge"],
  },
  {
    terme: "Eco-PTZ",
    slug: "eco-ptz",
    acronyme: "Eco-Pret a Taux Zero",
    definition: "Pret bancaire finance par l'État pour financer les travaux de renovation energetique, sans interets ni frais.",
    developpement:
      "Jusqu'a 50 000 euros remboursables sur 20 ans maximum. Cumulable avec MaPrimeRenov' et les CEE. Accessible sans conditions de ressources pour le logement principal. L'entreprise doit etre RGE sauf pour un logement copropriete déjà certifié.",
    categorie: "financement",
  },
  {
    terme: "DGCCRF",
    slug: "dgccrf",
    acronyme: "Direction Generale de la Concurrence, de la Consommation et de la Repression des Fraudes",
    definition: "Service de l'État charge de veiller a la protection des consommateurs.",
    developpement:
      "La DGCCRF enquete sur les pratiques commerciales trompeuses, les arnaques a la renovation energetique, les demarchages abusifs. Elle publié chaque annee un rapport avec les secteurs les plus signalés. L'Observatoire consulte les signalements publics DGCCRF lors de l'examen des dossiers Laureats.",
    source: { label: "DGCCRF", url: "https://www.economie.gouv.fr/dgccrf" },
    categorie: "juridique",
  },
  {
    terme: "Devis",
    slug: "devis",
    definition: "Document écrit, détaillé et signé qui chiffre une prestation avant execution.",
    developpement:
      "Obligatoire pour les travaux de plus de 150 euros TTC (article L. 111-1 du Code de la consommation). Doit mentionner : identite complete du pro (SIRET, adresse, assurance), nature et quantite des prestations, prix unitaire et total HT/TTC, conditions de paiement, date limite de validite. Un devis signé vaut engagement reciproque.",
    categorie: "juridique",
  },
  {
    terme: "Assurance decennale",
    slug: "decennale",
    definition: "Assurance obligatoire qui couvre pendant dix ans les malfaçons compromettant la solidite ou l'usage d'un ouvrage de construction.",
    developpement:
      "Tout professionnel du batiment qui intervient sur le gros oeuvre, le clos et le couvert, ou les equipements indissociables doit y souscrire avant l'ouverture du chantier. Le client peut demander l'attestation en cours de validite. Defaut d'assurance decennale : delit penal passible d'amende et d'emprisonnement.",
    categorie: "juridique",
  },
  {
    terme: "ITE",
    slug: "ite",
    acronyme: "Isolation Thermique par l'Exterieur",
    definition: "Technique qui consiste a envelopper le batiment d'une couche isolante appliquee sur la facade.",
    developpement:
      "Permet d'eviter les ponts thermiques et de conserver l'inertie des murs. Plus chere que l'isolation interieure (ITI) mais plus efficace. Necessite souvent un permis de construire ou une declaration préalable (modifie l'aspect exterieur). Eligible MaPrimeRenov', CEE, Eco-PTZ, TVA 5.5%.",
    categorie: "technique",
    voirAussi: ["maprimerenov", "rge"],
  },
  {
    terme: "Pompe a chaleur",
    slug: "pompe-a-chaleur",
    acronyme: "PAC",
    definition: "Systeme de chauffage qui extrait les calories de l'air, de l'eau ou du sol pour les restituer dans un logement.",
    developpement:
      "Trois types : air-eau (la plus installee en renovation), air-air (sans eau chaude sanitaire), geothermique (sol-eau, performante mais couteuse). Rendement mesure par le COP (Coefficient de Performance). Eligible MaPrimeRenov' si installee par un professionnel RGE Qualibat ou Qualit'EnR.",
    categorie: "technique",
    voirAussi: ["rge", "maprimerenov"],
  },
  {
    terme: "Score de Confiance",
    slug: "score-de-confiance",
    definition: "Indicateur /10 calcule par L'Observatoire pour classer les professionnels, base sur six criteres publics.",
    developpement:
      "Ancienneté Sirene (3 pts) + certification RGE ou Qualibat (2 pts) + avis publics supérieurs à 4 sur 5 (2 pts) + SIRET actif (1 pt) + site web professionnel (1 pt) + photos réalisations (1 pt). Recalculé tous les 30 jours. Méthode détaillée accessible depuis la barre de navigation.",
    categorie: "reglementation",
    voirAussi: ["rge", "qualibat", "sirene"],
  },
  {
    terme: "Portrait Lauréat",
    slug: "portrait-laureat",
    definition: "Distinction annuelle decernee par L'Observatoire a un nombre limite de professionnels après examen éditorial complet.",
    developpement:
      "Inclut un entretien avec le dirigeant, une verification terrain d'au moins une realisation recente, trois entretiens avec des clients finaux références. Medaille d'Or. Portrait long format redige par la rédaction. Ne peut etre obtenu par abonnement seul , la selection est éditoriale.",
    categorie: "reglementation",
    voirAussi: ["score-de-confiance"],
  },
];

export function termeBySlug(slug: string): TermeGlossaire | undefined {
  return glossaire.find((t) => t.slug === slug);
}

export function termesByCategorie(cat: TermeGlossaire["categorie"]): TermeGlossaire[] {
  return glossaire.filter((t) => t.categorie === cat);
}
