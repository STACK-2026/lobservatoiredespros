/**
 * Tarifs prestations BTP , 60 entrees (15 metiers x 4 prestations)
 * Sources : France Renov', ADEME, INSEE BTP, Capeb, federations metier
 *
 * Toutes les fourchettes : 2026, hors aides (MaPrimeRenov', CEE, eco-PTZ).
 * Pose et fourniture comprises sauf mention contraire dans `notes`.
 */

export interface Tarif {
  slug: string;
  metier: string;
  nom: string;
  accroche: string;
  prix_min: number;
  prix_max: number;
  unite: "intervention" | "m2" | "ml" | "u" | "h" | "annee" | "arbre";
  /** Pose seule, fourniture seule, ou tout compris */
  inclus: "tout-compris" | "pose-seule" | "fourniture-seule";
  /** Facteurs qui font varier le prix (3 a 5 entrees, sans tirets cadratins) */
  facteurs: string[];
  /** Sous-options de prix (ex: par materiau, par gamme), optionnel */
  variantes?: { nom: string; prix_min: number; prix_max: number; note?: string }[];
  /** Conseils pour faire baisser la facture, optionnel */
  economies?: string[];
  /** 3 questions frequentes */
  faq: { q: string; r: string }[];
  /** Source publique consultable */
  source: { label: string; url: string };
  /** Note editoriale eventuelle */
  notes?: string;
}

export const TARIFS: Tarif[] = [
  // ============================================================
  // PLOMBIER
  // ============================================================
  {
    slug: "changement-chauffe-eau",
    metier: "plombier",
    nom: "Changement de chauffe-eau",
    accroche: "Remplacer un cumulus electrique ou un ballon thermodynamique : prix au reel.",
    prix_min: 300,
    prix_max: 3500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Type d'appareil : electrique, thermodynamique ou solaire",
      "Capacite (litres) et marque",
      "Reprise de la plomberie existante (raccords, evacuations)",
      "Acces au local technique (cave, garage, comble)",
    ],
    variantes: [
      { nom: "Cumulus electrique 200L", prix_min: 300, prix_max: 900 },
      { nom: "Chauffe-eau thermodynamique 200L", prix_min: 1800, prix_max: 3500, note: "Eligible MaPrimeRenov' jusqu'a 1200 euros" },
      { nom: "Chauffe-eau solaire individuel", prix_min: 4500, prix_max: 7500, note: "Pose comprise, hors capteurs > 4m2" },
    ],
    economies: [
      "Demander 3 devis et exiger la meme capacite et le meme rendement (ETAS)",
      "Faire poser hors saison (octobre a fevrier) : artisans plus disponibles",
      "Verifier l'eligibilite MaPrimeRenov' pour le thermodynamique avant signature",
    ],
    faq: [
      { q: "Combien de temps pour la pose ?", r: "Comptez 2 a 4 heures pour un cumulus electrique standard, une demi-journee pour un thermodynamique." },
      { q: "Faut-il un artisan certifie RGE ?", r: "Oui pour beneficier des aides MaPrimeRenov' et CEE sur le thermodynamique ou le solaire." },
      { q: "Quelle duree de vie attendre ?", r: "10 a 15 ans pour un cumulus electrique, 15 a 20 ans pour un thermodynamique bien entretenu." },
    ],
    source: { label: "Guide France Renov' eau chaude sanitaire", url: "https://france-renov.gouv.fr/aides/eligibilite/chauffe-eau" },
  },
  {
    slug: "depannage-fuite",
    metier: "plombier",
    nom: "Depannage fuite d'eau",
    accroche: "Intervention en urgence : temps de main-d'oeuvre et acces a la fuite font tout.",
    prix_min: 80,
    prix_max: 450,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Heure d'intervention : jour, nuit, week-end ou ferie",
      "Localisation de la fuite (apparente ou encastree)",
      "Petits travaux de finition (carrelage, placo)",
      "Frais de deplacement et de detection",
    ],
    variantes: [
      { nom: "Fuite robinet ou raccord", prix_min: 80, prix_max: 180 },
      { nom: "Fuite chasse d'eau ou WC", prix_min: 100, prix_max: 250 },
      { nom: "Fuite encastree (recherche par cameras ou gaz tracer)", prix_min: 250, prix_max: 600 },
      { nom: "Intervention nuit/dimanche/ferie", prix_min: 200, prix_max: 600, note: "Majoration legale jusqu'a 100 pourcents" },
    ],
    economies: [
      "Avant d'appeler : couper l'arrivee d'eau generale et photographier la fuite",
      "Refuser tout intervention sans devis ecrit signe (sauf urgence avec degats en cours)",
      "Comparer les frais de deplacement, parfois plus chers que la reparation",
    ],
    faq: [
      { q: "Le plombier peut-il refuser un devis ?", r: "Non, depuis 2017 un devis ecrit est obligatoire des que la prestation depasse 100 euros TTC." },
      { q: "Mon assurance habitation prend-elle en charge ?", r: "Si la fuite cause des degats des eaux, oui. Pas pour l'usure normale d'une installation." },
      { q: "Combien coute la recherche de fuite ?", r: "200 a 600 euros selon la methode (hygrometre, gaz tracer, cameras thermiques)." },
    ],
    source: { label: "Direction generale concurrence consommation repression fraudes (DGCCRF)", url: "https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Le-devis" },
  },
  {
    slug: "installation-douche-italienne",
    metier: "plombier",
    nom: "Installation douche a l'italienne",
    accroche: "Demolition baignoire, etancheite, evacuation, faience : un poste a 3000 euros minimum.",
    prix_min: 1500,
    prix_max: 6500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Demolition d'une baignoire ou d'une douche existante",
      "Niveau d'evacuation (siphon de sol ou caniveau)",
      "Surface a carreler et gamme de faience",
      "Receveur extra-plat ou douche en zero ressaut",
    ],
    variantes: [
      { nom: "Douche standard 80x80 cm", prix_min: 1500, prix_max: 3500 },
      { nom: "Douche a l'italienne premium 90x140 cm", prix_min: 3500, prix_max: 6500 },
      { nom: "Douche PMR plain-pied", prix_min: 4500, prix_max: 8500, note: "Eligible aide MaPrimeAdapt' jusqu'a 70 pourcents" },
    ],
    economies: [
      "Conserver l'arrivee et l'evacuation d'eau existantes evite 500 a 1000 euros",
      "Choisir un meuble vasque standard (Leroy, Castorama) plutot que sur-mesure",
      "Eligible TVA reduite 10 pourcents sur logement plus de 2 ans",
    ],
    faq: [
      { q: "Combien de jours de chantier ?", r: "5 a 8 jours ouvres, sechage de l'etancheite et du carrelage compris." },
      { q: "Quelle pente pour l'evacuation ?", r: "Minimum 1 pourcent (1 cm par metre) vers le siphon, 2 pourcents recommandes." },
      { q: "Faut-il l'accord de la copropriete ?", r: "Si percement de mur porteur ou modification de colonnes : oui." },
    ],
    source: { label: "ADEME guide salle de bain durable", url: "https://librairie.ademe.fr/" },
  },
  {
    slug: "pompe-chaleur-eau-chaude",
    metier: "plombier",
    nom: "Installation pompe a chaleur eau chaude (chauffe-eau thermodynamique)",
    accroche: "75 pourcents d'energie en moins qu'un cumulus electrique : retour sur investissement 5 a 7 ans.",
    prix_min: 1800,
    prix_max: 4500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Capacite (200, 250 ou 300 litres)",
      "Type : sur air ambiant, sur air exterieur ou split",
      "Local d'installation (besoin minimum 10 m3)",
      "Reprise de la plomberie et de l'electricite",
    ],
    variantes: [
      { nom: "Sur air ambiant 200L (gamme standard)", prix_min: 1800, prix_max: 2800 },
      { nom: "Sur air exterieur 200L (rendement superieur)", prix_min: 2500, prix_max: 3800 },
      { nom: "Split 250L (avec unite exterieure)", prix_min: 3500, prix_max: 4500, note: "Idem clim, necessite Cat 1 fluides" },
    ],
    economies: [
      "MaPrimeRenov' : jusqu'a 1200 euros selon revenus",
      "Coup de Pouce CEE : 100 a 300 euros sur la facture",
      "Eco-PTZ jusqu'a 30 000 euros si bouquet de travaux",
    ],
    faq: [
      { q: "Quel COP minimum exiger ?", r: "Coefficient de Performance superieur a 2,5 (norme NF Electricite Performance categorie C)." },
      { q: "Quelle consommation annuelle ?", r: "Environ 800 a 1200 kWh/an pour 4 personnes contre 3500 kWh pour un cumulus electrique." },
      { q: "Faut-il un installateur RGE ?", r: "Oui pour les aides. Verifier la qualification QualiPAC ou QualiSol sur france-renov.gouv.fr." },
    ],
    source: { label: "France Renov' chauffe-eau thermodynamique", url: "https://france-renov.gouv.fr/aides/eligibilite/chauffe-eau-thermodynamique" },
  },

  // ============================================================
  // ELECTRICIEN
  // ============================================================
  {
    slug: "mise-aux-normes-tableau",
    metier: "electricien",
    nom: "Mise aux normes tableau electrique (NF C 15-100)",
    accroche: "Tableau aux normes 2026 : disjoncteurs differentiels 30 mA, parafoudre obligatoire en zone risque.",
    prix_min: 700,
    prix_max: 3500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Etat du tableau existant (annee, technologie)",
      "Nombre de circuits a mettre aux normes",
      "Ajout d'un parafoudre obligatoire si zone AQ2",
      "Reprise de la GTL (Gaine Technique Logement)",
    ],
    variantes: [
      { nom: "Mise a jour tableau T2 (jusqu'a 18 modules)", prix_min: 700, prix_max: 1500 },
      { nom: "Remplacement complet T3 (35 modules)", prix_min: 1500, prix_max: 3000 },
      { nom: "Refonte totale avec GTL conforme", prix_min: 2500, prix_max: 5000 },
    ],
    economies: [
      "Profiter d'autres travaux electriques pour mutualiser le tableau",
      "Conserver les disjoncteurs differentiels recents si moins de 10 ans",
      "TVA 10 pourcents sur logement existant",
    ],
    faq: [
      { q: "Faut-il forcement un Consuel apres ?", r: "Oui en cas de remplacement complet ou si le tableau touche au point de livraison Enedis." },
      { q: "Combien de temps les normes evoluent ?", r: "NF C 15-100 amendement A5 en vigueur depuis 2021, prochain en 2026 (parafoudre etendu)." },
      { q: "Disjoncteur 30 mA obligatoire partout ?", r: "Oui sur tous les circuits depuis 2003 (interrupteurs differentiels en tete de groupe)." },
    ],
    source: { label: "Promotelec NF C 15-100 guide pratique", url: "https://www.promotelec.com/" },
  },
  {
    slug: "installation-prise-electrique",
    metier: "electricien",
    nom: "Installation prise electrique supplementaire",
    accroche: "Du simple ajout en saillie au passage en encastre : facteur 5 entre les deux.",
    prix_min: 50,
    prix_max: 250,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Pose en saillie (apparent) ou encastre (mur creuse)",
      "Distance au tableau electrique",
      "Type de prise : 16A standard, 20A four, 32A plaque",
      "Refection peinture/placo apres encastrement",
    ],
    variantes: [
      { nom: "Prise 16A en saillie", prix_min: 50, prix_max: 90 },
      { nom: "Prise 16A encastree", prix_min: 90, prix_max: 180 },
      { nom: "Prise 32A plaque cuisson", prix_min: 150, prix_max: 350, note: "Necessite circuit dedie" },
    ],
    economies: [
      "Grouper plusieurs prises lors d'une meme intervention (deplacement mutualise)",
      "Choisir des appareillages standards (Legrand Mosaic, Schneider Odace)",
      "Demander un devis incluant la peinture si encastre",
    ],
    faq: [
      { q: "Faut-il un certificat Consuel pour 1 prise ?", r: "Non, sauf si le circuit dedie passe par un nouveau disjoncteur." },
      { q: "Une prise USB integree, c'est combien en plus ?", r: "Compter 30 a 60 euros de fourniture en plus pour un module USB-C double." },
      { q: "Peut-on poser une prise dans une salle de bain ?", r: "Oui, hors volume 0/1/2 (plus de 60 cm autour de la baignoire/douche), avec disjoncteur 30 mA." },
    ],
    source: { label: "Capeb guide tarifs electricite", url: "https://www.capeb.fr/" },
  },
  {
    slug: "pose-luminaire",
    metier: "electricien",
    nom: "Pose et raccordement de luminaire",
    accroche: "Lustre, suspension, applique : la fourchette depend du support et de la hauteur.",
    prix_min: 40,
    prix_max: 180,
    unite: "u",
    inclus: "pose-seule",
    facteurs: [
      "Hauteur de pose (acces avec echafaudage si plus de 3 m)",
      "Type de luminaire (lustre lourd, applique simple, suspension)",
      "Pose sur point existant ou creation d'un point",
      "Domotique : variateur, va-et-vient, telecommande",
    ],
    variantes: [
      { nom: "Pose simple sur DCL existant", prix_min: 40, prix_max: 90 },
      { nom: "Pose avec creation d'un point lumineux", prix_min: 120, prix_max: 250 },
      { nom: "Suspension grande hauteur (plus de 3 m)", prix_min: 150, prix_max: 350 },
    ],
    economies: [
      "Profiter d'une intervention pour grouper 3 a 5 luminaires",
      "Acheter le luminaire soi-meme et faire poser uniquement",
      "Eviter les variateurs sur ampoules LED non dimmables",
    ],
    faq: [
      { q: "Mon plafond a-t-il un point DCL ?", r: "Tout logement neuf depuis 2003 oui (Dispositif de Connexion pour Luminaire). Avant : a verifier." },
      { q: "Pose multipoint, quel rabais ?", r: "Comptez 20 a 30 pourcents de remise au-dela de 3 luminaires sur le meme rendez-vous." },
      { q: "Eclairage exterieur avec detecteur ?", r: "Comptez 80 a 200 euros supplementaires pour la fourniture du detecteur et son raccordement." },
    ],
    source: { label: "Capeb statistiques charges electricien", url: "https://www.capeb.fr/" },
  },
  {
    slug: "borne-recharge-vehicule-electrique",
    metier: "electricien",
    nom: "Installation borne de recharge vehicule electrique",
    accroche: "Wallbox 7 kW, 11 kW ou 22 kW : prevoir disjoncteur dedie et certification IRVE pour les aides.",
    prix_min: 800,
    prix_max: 3500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Puissance de la borne : 3,7 / 7 / 11 / 22 kW",
      "Distance entre tableau electrique et borne",
      "Mode de pose (mural, sur pied, abrite)",
      "Communication smart-charge (4G, Wi-Fi)",
    ],
    variantes: [
      { nom: "Wallbox 7 kW maison individuelle", prix_min: 800, prix_max: 1500, note: "Credit d'impot 75 pourcents jusqu'a 500 euros" },
      { nom: "Wallbox 11 kW", prix_min: 1200, prix_max: 2200 },
      { nom: "Borne 22 kW + section dediee", prix_min: 1800, prix_max: 3500 },
    ],
    economies: [
      "Credit d'impot transition energetique : 75 pourcents jusqu'a 500 euros par borne",
      "Programme Advenir (copropriete) : prime jusqu'a 600 euros + 50 pourcents des couts",
      "Choisir une borne universelle Type 2 (compatible toutes marques)",
    ],
    faq: [
      { q: "Faut-il un electricien IRVE ?", r: "Obligatoire pour le credit d'impot et au-dela de 3,7 kW. Trois niveaux IRVE : P1, P2, P3." },
      { q: "Je peux installer en copropriete ?", r: "Oui via le droit a la prise (loi 2014). Le bailleur ne peut pas refuser un raccordement individuel." },
      { q: "Mon abonnement Enedis suffit ?", r: "Pour 7 kW : abonnement 12 kVA suffit (modulable). Au-dela : passer en triphase 18 ou 36 kVA." },
    ],
    source: { label: "Programme Advenir IRVE", url: "https://advenir.mobi/" },
  },

  // ============================================================
  // COUVREUR
  // ============================================================
  {
    slug: "refection-toiture",
    metier: "couvreur",
    nom: "Refection toiture complete",
    accroche: "Demontage, charpente, ecran sous-toiture, couverture neuve : 80 a 250 euros au m2.",
    prix_min: 80,
    prix_max: 250,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Type de couverture : tuiles terre cuite, ardoise, zinc",
      "Etat de la charpente (a renforcer ou non)",
      "Pente du toit et acces (echafaudage)",
      "Isolation par l'exterieur (sarking) en option",
    ],
    variantes: [
      { nom: "Tuiles canal mediterraneenes", prix_min: 80, prix_max: 130 },
      { nom: "Tuiles plates terre cuite", prix_min: 100, prix_max: 180 },
      { nom: "Ardoise naturelle", prix_min: 150, prix_max: 250 },
      { nom: "Zinc joint debout", prix_min: 130, prix_max: 220 },
    ],
    economies: [
      "Mutualiser avec une isolation par l'exterieur (sarking) eligible MaPrimeRenov'",
      "Reutiliser tuiles encore saines pour les zones cachees",
      "TVA 10 pourcents sur logement de plus de 2 ans",
    ],
    faq: [
      { q: "Combien de temps pour 100 m2 ?", r: "10 a 20 jours ouvres selon meteo et type de couverture." },
      { q: "Faut-il une autorisation d'urbanisme ?", r: "Declaration prealable obligatoire si changement d'aspect (couleur, materiau)." },
      { q: "Garantie decennale incluse ?", r: "Oui obligatoire. Demander une attestation nominative au demarrage du chantier." },
    ],
    source: { label: "ADEME guide isolation toiture", url: "https://librairie.ademe.fr/urbanisme-et-batiment/" },
  },
  {
    slug: "demoussage-toiture",
    metier: "couvreur",
    nom: "Demoussage et traitement hydrofuge toiture",
    accroche: "Pulverisation anti-mousse + impermeabilisant : preserve la couverture 5 a 10 ans.",
    prix_min: 8,
    prix_max: 25,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface et pente de la toiture",
      "Etat de la mousse (epaisse, lichens incrustes)",
      "Methode : pulverisation, brossage, haute pression",
      "Application d'un hydrofuge color ou incolore",
    ],
    variantes: [
      { nom: "Demoussage simple par pulverisation", prix_min: 8, prix_max: 15 },
      { nom: "Demoussage + hydrofuge incolore", prix_min: 12, prix_max: 20 },
      { nom: "Demoussage + hydrofuge colore", prix_min: 18, prix_max: 25 },
    ],
    economies: [
      "Operation a faire tous les 5 a 7 ans, pas plus souvent",
      "Mefiance face aux demarchages telephoniques (pratiques abusives frequentes)",
      "Refuser les paiements integraux d'avance",
    ],
    faq: [
      { q: "Quelle saison pour le demoussage ?", r: "Printemps ou automne, hors gel et grosses pluies." },
      { q: "Le haute pression endommage la toiture ?", r: "Oui sur tuiles canal et ardoise. Privilegier la pulverisation et le brossage." },
      { q: "L'hydrofuge change la couleur ?", r: "L'incolore preserve la teinte d'origine. Le colore est utilise pour rajeunir une toiture decoloree." },
    ],
    source: { label: "Que Choisir tests demoussages toiture 2024", url: "https://www.quechoisir.org/" },
  },
  {
    slug: "changement-tuiles-cassees",
    metier: "couvreur",
    nom: "Changement de tuiles cassees",
    accroche: "Intervention ciblee : 250 a 600 euros pour 5 a 20 tuiles.",
    prix_min: 250,
    prix_max: 800,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Nombre de tuiles a remplacer",
      "Type et disponibilite du modele d'origine",
      "Acces toiture (necessite echafaudage ou nacelle)",
      "Verification de la sous-toiture autour",
    ],
    variantes: [
      { nom: "1 a 5 tuiles", prix_min: 250, prix_max: 400 },
      { nom: "6 a 15 tuiles", prix_min: 400, prix_max: 600 },
      { nom: "16 a 30 tuiles", prix_min: 600, prix_max: 800 },
    ],
    economies: [
      "Identifier soi-meme les tuiles cassees apres tempete (jumelles depuis le sol)",
      "Stocker des tuiles d'avance lors de l'achat initial",
      "Faire appel a l'assurance habitation si tempete declaree (garantie evenements climatiques)",
    ],
    faq: [
      { q: "Mon assurance peut-elle prendre en charge ?", r: "Oui si la casse vient d'un evenement climatique (tempete, grele) declare. Pas pour l'usure normale." },
      { q: "Combien de temps avant intervention ?", r: "Comptez 1 a 3 semaines hors urgence, plus court si fuite active." },
      { q: "Tuile modele plus fabrique : que faire ?", r: "Le couvreur peut chercher en depot ou remettre des tuiles equivalentes (couleur proche)." },
    ],
    source: { label: "FFB Federation Francaise du Batiment couvreurs", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "isolation-combles-perdus",
    metier: "couvreur",
    nom: "Isolation combles perdus par soufflage",
    accroche: "Le geste le plus rentable : 25 pourcents d'economie de chauffage, eligible MaPrimeRenov'.",
    prix_min: 20,
    prix_max: 50,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface des combles a isoler",
      "Materiau : laine de verre, ouate de cellulose, laine de bois",
      "Resistance thermique R cible (minimum 7 m2.K/W)",
      "Acces aux combles (trappe, escalier, lucarnes)",
    ],
    variantes: [
      { nom: "Laine de verre soufflee R7", prix_min: 20, prix_max: 35 },
      { nom: "Ouate de cellulose soufflee R7", prix_min: 25, prix_max: 40 },
      { nom: "Laine de bois insufflee R8", prix_min: 35, prix_max: 50 },
    ],
    economies: [
      "MaPrimeRenov' : 7 a 25 euros/m2 selon revenus",
      "CEE Coup de Pouce : 10 a 30 euros/m2 supplementaires",
      "Eco-PTZ jusqu'a 15 000 euros si bouquet",
    ],
    faq: [
      { q: "R = 7 minimum, pourquoi ?", r: "Seuil 2026 pour MaPrimeRenov' et CEE. R = 8 ou 9 recommande pour atteinte BBC." },
      { q: "Combien de temps de chantier ?", r: "1 a 2 jours pour 100 m2 de combles avec une equipe de 2 personnes." },
      { q: "Comment verifier l'epaisseur posee ?", r: "Le couvreur place des piges graduees tous les 5 m2 pour controle visuel." },
    ],
    source: { label: "France Renov' isolation combles", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-combles" },
  },

  // ============================================================
  // MENUISIER
  // ============================================================
  {
    slug: "pose-fenetre-pvc",
    metier: "menuisier",
    nom: "Pose fenetre PVC double vitrage",
    accroche: "Du standard 1 vantail 80x100 au triple vitrage : la fourchette s'etale du simple au quadruple.",
    prix_min: 350,
    prix_max: 1500,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Dimensions et nombre de vantaux",
      "Type de vitrage : double standard, double phonique, triple",
      "Technique de pose : depose totale ou renovation",
      "Coefficient Uw cible (1,3 W/m2.K minimum pour aides)",
    ],
    variantes: [
      { nom: "1 vantail 80x100 standard", prix_min: 350, prix_max: 600 },
      { nom: "2 vantaux 120x140 double vitrage 4-16-4", prix_min: 600, prix_max: 1100 },
      { nom: "Triple vitrage 4-12-4-12-4", prix_min: 900, prix_max: 1500, note: "Eligible MaPrimeRenov'" },
    ],
    economies: [
      "MaPrimeRenov' jusqu'a 100 euros par fenetre selon revenus",
      "CEE Prime Renov' : 80 a 130 euros par fenetre",
      "Pose en renovation (sur dormant existant) economise 20 pourcents",
    ],
    faq: [
      { q: "PVC ou aluminium : quelle difference ?", r: "PVC : moins cher, isole mieux. Alu : plus design, plus durable, montants plus fins." },
      { q: "Garantie sur les vitrages ?", r: "10 ans decennale + 5 ans constructeur sur l'etancheite des vitrages isolants." },
      { q: "Faut-il une declaration prealable ?", r: "Oui si modification de l'aspect exterieur (couleur, dimensions, type)." },
    ],
    source: { label: "France Renov' fenetres", url: "https://france-renov.gouv.fr/aides/eligibilite/fenetre" },
  },
  {
    slug: "porte-entree-securite",
    metier: "menuisier",
    nom: "Porte d'entree de securite",
    accroche: "Bois, alu ou acier : la difference se joue sur les points de fermeture (3, 5 ou 7 points).",
    prix_min: 1200,
    prix_max: 4500,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Materiau : bois, aluminium, acier, mixte",
      "Nombre de points de fermeture (3, 5 ou 7)",
      "Niveau de certification A2P (BP1, BP2, BP3)",
      "Vitrage et serrurerie connectee (option)",
    ],
    variantes: [
      { nom: "PVC 3 points", prix_min: 1200, prix_max: 2200 },
      { nom: "Aluminium 5 points A2P BP2", prix_min: 2500, prix_max: 3500 },
      { nom: "Bois exotique 7 points A2P BP3", prix_min: 3500, prix_max: 4500 },
    ],
    economies: [
      "Verifier remise de l'assurance habitation (jusqu'a 10 pourcents) si A2P",
      "Choisir une marque francaise pour SAV plus rapide",
      "TVA 10 pourcents sur logement de plus de 2 ans",
    ],
    faq: [
      { q: "Que signifie A2P ?", r: "Certification CNPP qui mesure la resistance au cambriolage : BP1 = 5 min, BP2 = 10 min, BP3 = 15 min." },
      { q: "Faut-il une serrure connectee ?", r: "Pratique pour Airbnb ou colocations, mais exige changement de batterie et risque de panne electronique." },
      { q: "Combien de temps de pose ?", r: "Une journee pour une porte d'entree standard, 1,5 jour pour une porte alu sur mesure." },
    ],
    source: { label: "CNPP certification A2P portes", url: "https://www.cnpp.com/" },
  },
  {
    slug: "escalier-bois-sur-mesure",
    metier: "menuisier",
    nom: "Escalier bois sur mesure",
    accroche: "Droit, quart-tournant, helicoidal : du modele standard a l'escalier d'architecte.",
    prix_min: 2500,
    prix_max: 12000,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Forme : droit, quart-tournant simple, double, helicoidal",
      "Essence du bois (hetre, chene, frene)",
      "Type de marches (massive, plaquee)",
      "Garde-corps et rampe (bois, metal, verre)",
    ],
    variantes: [
      { nom: "Escalier droit hetre 12 marches", prix_min: 2500, prix_max: 4500 },
      { nom: "Quart-tournant chene massif", prix_min: 4500, prix_max: 7500 },
      { nom: "Helicoidal sur fut central", prix_min: 6500, prix_max: 12000 },
    ],
    economies: [
      "Privilegier des essences locales (chene, frene) plus economiques que tropicales",
      "Garde-corps en metal industriel : moins cher et durable",
      "Eviter les sur-mesures fantaisistes (rampes courbes, sculptees)",
    ],
    faq: [
      { q: "Quelle pente reglementaire ?", r: "Hauteur de marche 17 a 21 cm, giron 25 a 32 cm. Au-dela : escalier non conforme." },
      { q: "Bois massif ou plaque ?", r: "Massif : plus cher mais ponce a l'infini. Plaque : prix divise par 2 mais entretien limite." },
      { q: "Combien de temps en atelier ?", r: "2 a 4 semaines de fabrication, 2 a 3 jours de pose sur site." },
    ],
    source: { label: "Capeb metiers menuisiers", url: "https://www.capeb.fr/" },
  },
  {
    slug: "placard-sur-mesure",
    metier: "menuisier",
    nom: "Placard sur-mesure",
    accroche: "Du dressing simple a la solution integree avec eclairage : le metre lineaire fait foi.",
    prix_min: 800,
    prix_max: 4500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Lineaire et hauteur du placard",
      "Materiau : melamine, bois massif, laque",
      "Type de portes : coulissantes, battantes, sans portes",
      "Equipements interieurs (LEDs, tiroirs, panieres)",
    ],
    variantes: [
      { nom: "Placard 2 m melamine portes coulissantes", prix_min: 800, prix_max: 1500 },
      { nom: "Dressing 3 m chene portes battantes", prix_min: 2000, prix_max: 3500 },
      { nom: "Solution integree 4 m + eclairage LED", prix_min: 3000, prix_max: 4500 },
    ],
    economies: [
      "Acheter les amenagements interieurs sur Ikea/Lapeyre et faire poser le coffre",
      "Eviter les portes laquees brillantes (entretien et SAV difficile)",
      "Profiter d'autres travaux pour negocier (peinture, electricite)",
    ],
    faq: [
      { q: "Combien de temps de fabrication ?", r: "3 a 6 semaines apres metrage definitif, fabrication en atelier." },
      { q: "Sur murs non droits, comment faire ?", r: "Pose de joues ajustees ou cale d'habillage. Le metrage initial doit relever les defauts." },
      { q: "Garantie SAV ?", r: "Decennale obligatoire + garantie biennale sur quincaillerie (charnieres, rails)." },
    ],
    source: { label: "Federation francaise du batiment menuisiers", url: "https://www.ffbatiment.fr/" },
  },

  // ============================================================
  // ISOLATION
  // ============================================================
  {
    slug: "isolation-combles-perdus-soufflage",
    metier: "isolation",
    nom: "Isolation combles perdus par soufflage",
    accroche: "Le geste isolation le plus rentable : ROI 5 a 7 ans, eligible toutes les aides.",
    prix_min: 20,
    prix_max: 45,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface des combles",
      "Materiau : laine de verre, ouate de cellulose, laine de bois",
      "Resistance thermique R cible (minimum 7 pour aides)",
      "Etat existant (a vider ou a recouvrir)",
    ],
    variantes: [
      { nom: "Laine de verre R7", prix_min: 20, prix_max: 30 },
      { nom: "Ouate de cellulose R7", prix_min: 25, prix_max: 38 },
      { nom: "Laine de bois R8", prix_min: 35, prix_max: 45 },
    ],
    economies: [
      "MaPrimeRenov' Combles : 7 a 25 euros/m2",
      "CEE Coup de Pouce : 10 a 30 euros/m2",
      "Cumul possible : net a 0 euro pour menages tres modestes",
    ],
    faq: [
      { q: "Mes combles sont accessibles, autre methode ?", r: "Si combles habitables ou amenageables : isolation des rampants par l'interieur (panneaux)." },
      { q: "Comment verifier la qualite ?", r: "Demander piges graduees + facture detaillee (volume, masse posee, certification ACERMI)." },
      { q: "L'humidite est-elle un risque ?", r: "Pas si pare-vapeur correctement pose et ventilation conforme NF DTU 24.1." },
    ],
    source: { label: "France Renov' combles", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-combles" },
  },
  {
    slug: "isolation-murs-exterieurs-ite",
    metier: "isolation",
    nom: "Isolation par l'exterieur (ITE)",
    accroche: "Le geste le plus efficace pour passer de F a C : 110 a 200 euros au m2 facade.",
    prix_min: 110,
    prix_max: 220,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface de facade et hauteur (echafaudage)",
      "Materiau isolant (PSE, laine de bois, polyurethane)",
      "Finition : enduit hydraulique, bardage bois, vetage",
      "Reprise des points singuliers (encadrements, balcons)",
    ],
    variantes: [
      { nom: "PSE + enduit mince", prix_min: 110, prix_max: 160 },
      { nom: "Laine de bois + enduit chaux", prix_min: 150, prix_max: 200 },
      { nom: "Bardage bois ventile", prix_min: 180, prix_max: 220 },
    ],
    economies: [
      "MaPrimeRenov' Mur Exterieur : 15 a 75 euros/m2 selon revenus",
      "CEE : 12 a 25 euros/m2",
      "Eco-PTZ jusqu'a 30 000 euros sur bouquet",
    ],
    faq: [
      { q: "Faut-il une declaration prealable ?", r: "Oui obligatoire (modification d'aspect). Permis de construire si plus de 20 m2 ajoutes." },
      { q: "Mes fenetres bougent-elles ?", r: "Oui, leur tableau s'allonge de l'epaisseur isolante. Prevoir tapees d'isolation." },
      { q: "Combien de temps de chantier ?", r: "3 a 6 semaines pour une maison 100 m2 facade, hors meteo defavorable." },
    ],
    source: { label: "France Renov' isolation murs exterieurs", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-murs" },
  },
  {
    slug: "isolation-rampants",
    metier: "isolation",
    nom: "Isolation rampants combles amenages",
    accroche: "Sous toiture habitable : pose de panneaux ou roulea entre chevrons + finition placo.",
    prix_min: 40,
    prix_max: 90,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface a isoler",
      "Epaisseur necessaire (R minimum 6 pour aides)",
      "Pare-vapeur et finition placo",
      "Contre-cloison eventuelle si grande hauteur",
    ],
    variantes: [
      { nom: "Laine de verre 200 mm + placo", prix_min: 40, prix_max: 60 },
      { nom: "Laine de bois 200 mm + placo phonique", prix_min: 60, prix_max: 80 },
      { nom: "Sarking par exterieur (depose toiture)", prix_min: 150, prix_max: 250 },
    ],
    economies: [
      "Mutualiser avec refection toiture (sarking)",
      "MaPrimeRenov' jusqu'a 25 euros/m2",
      "Verifier ventilation existante avant pose pare-vapeur",
    ],
    faq: [
      { q: "Quelle epaisseur minimale ?", r: "200 mm minimum pour atteindre R = 6, 240 mm pour R = 7 (cible BBC)." },
      { q: "Pare-vapeur obligatoire ?", r: "Oui, cote chaud (interieur). Sa pose conditionne la garantie decennale." },
      { q: "Hauteur sous plafond perdue ?", r: "Comptez 25 a 30 cm de hauteur en moins (isolant + placo)." },
    ],
    source: { label: "ADEME guide isolation toiture interieure", url: "https://librairie.ademe.fr/" },
  },
  {
    slug: "isolation-sous-sol",
    metier: "isolation",
    nom: "Isolation sous-sol et planchers bas",
    accroche: "Plafond du sous-sol par dessous : 30 a 70 euros au m2, ROI rapide grace aux pertes par le sol.",
    prix_min: 30,
    prix_max: 70,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Hauteur sous plafond du sous-sol",
      "Materiau : PSE, laine minerale rigide, polyurethane",
      "Finition (laisse brut ou enduit)",
      "Reprise reseau electrique au plafond",
    ],
    variantes: [
      { nom: "Panneau PSE colle", prix_min: 30, prix_max: 45 },
      { nom: "Polyurethane projete", prix_min: 45, prix_max: 65 },
      { nom: "Laine minerale rigide + finition", prix_min: 55, prix_max: 70 },
    ],
    economies: [
      "MaPrimeRenov' Plancher Bas : 20 a 30 euros/m2",
      "CEE : 10 a 15 euros/m2",
      "Combinable avec isolation murs sous-sol pour eligibilite plus large",
    ],
    faq: [
      { q: "R minimum pour aides ?", r: "R = 3 m2.K/W minimum pour MaPrimeRenov' (epaisseur 100 a 120 mm de PSE)." },
      { q: "Effet sur les sols au-dessus ?", r: "Sols 2 a 4 degres plus chauds en hiver, gain notable dans les pieces de vie." },
      { q: "Polyurethane projete : risques ?", r: "Etancheite parfaite mais pas reversible. Verifier que l'artisan est certifie ACERMI projection." },
    ],
    source: { label: "France Renov' planchers bas", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-sols" },
  },

  // ============================================================
  // CHAUFFAGISTE
  // ============================================================
  {
    slug: "installation-chaudiere-gaz",
    metier: "chauffagiste",
    nom: "Installation chaudiere gaz a condensation",
    accroche: "Plus eligible MaPrimeRenov' depuis 2023 : ROI sur economie consommation.",
    prix_min: 3500,
    prix_max: 7500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Puissance (12, 18, 24, 35 kW)",
      "Marque et gamme (entree, milieu, haut)",
      "Reprise tuyauterie et radiateurs",
      "Sortie ventouse ou cheminee a tuber",
    ],
    variantes: [
      { nom: "Chaudiere 24 kW entree de gamme", prix_min: 3500, prix_max: 4500 },
      { nom: "Chaudiere 24 kW milieu de gamme (Viessmann, Saunier Duval)", prix_min: 4500, prix_max: 6000 },
      { nom: "Chaudiere haut de gamme + thermostat connecte", prix_min: 6000, prix_max: 7500 },
    ],
    economies: [
      "Plus de MaPrimeRenov' depuis janvier 2023, mais CEE encore disponibles",
      "Eviter le surdimensionnement (devis 24 kW pour 100 m2 souvent excessif)",
      "Negocier le contrat d'entretien sur 5 ans des l'achat",
    ],
    faq: [
      { q: "Quelle duree de vie ?", r: "15 a 20 ans avec entretien annuel obligatoire." },
      { q: "Pompe a chaleur plus interessante ?", r: "Oui en renovation : moins chere a l'usage, MaPrimeRenov' jusqu'a 5000 euros." },
      { q: "Sortie ventouse autorisee partout ?", r: "Oui sauf reglements de copropriete restrictifs. DTU 24.1 a respecter." },
    ],
    source: { label: "France Renov' systemes de chauffage", url: "https://france-renov.gouv.fr/aides/eligibilite/chauffage" },
  },
  {
    slug: "entretien-chaudiere-annuel",
    metier: "chauffagiste",
    nom: "Entretien annuel chaudiere",
    accroche: "Obligatoire pour les gaz et fioul : controle securite + nettoyage + attestation.",
    prix_min: 80,
    prix_max: 200,
    unite: "annee",
    inclus: "tout-compris",
    facteurs: [
      "Type de chaudiere : gaz, fioul, bois, mixte",
      "Contrat ponctuel ou annuel",
      "Garanties incluses (P1 visite, P2 reparations)",
      "Region (frais deplacement)",
    ],
    variantes: [
      { nom: "Visite ponctuelle gaz/fioul", prix_min: 80, prix_max: 150 },
      { nom: "Contrat annuel P1 visite", prix_min: 120, prix_max: 200 },
      { nom: "Contrat P1+P2 (reparations incluses)", prix_min: 200, prix_max: 350 },
    ],
    economies: [
      "Negocier sur un contrat 3 ans (rabais 10 a 15 pourcents)",
      "Refuser les contrats avec clauses de reconduction tacite floues",
      "Comparer P1 simple et tout inclus selon age chaudiere",
    ],
    faq: [
      { q: "L'entretien est-il obligatoire ?", r: "Oui pour gaz, fioul, bois (decret 2009-649). Locataire a la charge." },
      { q: "Que se passe-t-il sans attestation ?", r: "L'assurance habitation peut refuser sa garantie en cas de sinistre." },
      { q: "Combien de temps prend l'entretien ?", r: "1 a 2 heures, attestation remise sur place." },
    ],
    source: { label: "Service Public entretien chaudiere", url: "https://www.service-public.fr/particuliers/vosdroits/F31894" },
  },
  {
    slug: "pompe-chaleur-air-eau",
    metier: "chauffagiste",
    nom: "Installation pompe a chaleur air-eau",
    accroche: "Le remplacement de chaudiere fioul ou gaz le plus aide : MaPrimeRenov' jusqu'a 5000 euros.",
    prix_min: 8000,
    prix_max: 18000,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Puissance (8, 11, 14 kW)",
      "Type : monobloc ou bibloc, basse ou haute temperature",
      "Reprise circuit de chauffage existant",
      "Plancher chauffant ou radiateurs basse temperature",
    ],
    variantes: [
      { nom: "PAC air-eau 8 kW basse temperature", prix_min: 8000, prix_max: 12000 },
      { nom: "PAC air-eau 11 kW haute temperature", prix_min: 12000, prix_max: 15000 },
      { nom: "PAC + ballon thermodynamique", prix_min: 14000, prix_max: 18000 },
    ],
    economies: [
      "MaPrimeRenov' : 2000 a 5000 euros selon revenus",
      "CEE Coup de Pouce : 4000 a 5000 euros",
      "Eco-PTZ jusqu'a 30 000 euros",
    ],
    faq: [
      { q: "Quel COP minimal exiger ?", r: "ETAS superieur a 126 pourcents pour MaPrimeRenov'. COP nominal 3,5 ou plus a -7 degC." },
      { q: "Bruit de l'unite exterieure ?", r: "35 a 50 dB(A). Reglement copropriete et arrete bruit du voisinage a verifier." },
      { q: "Faut-il une chaudiere d'appoint ?", r: "Pas obligatoire pour PAC haute temperature, recommande en zone H1 froide." },
    ],
    source: { label: "France Renov' PAC air-eau", url: "https://france-renov.gouv.fr/aides/eligibilite/pompe-chaleur" },
  },
  {
    slug: "radiateurs-eau-chaude",
    metier: "chauffagiste",
    nom: "Pose radiateurs eau chaude",
    accroche: "Acier, fonte ou design : le pas de prix tient au materiau et au mode de pose.",
    prix_min: 250,
    prix_max: 1500,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Materiau : acier, alu, fonte, design",
      "Puissance (700 a 2500 W)",
      "Reprise tuyauterie en cuivre, multicouche ou PER",
      "Vannes thermostatiques connectees",
    ],
    variantes: [
      { nom: "Radiateur acier 1500 W", prix_min: 250, prix_max: 500 },
      { nom: "Radiateur alu 2000 W", prix_min: 400, prix_max: 800 },
      { nom: "Radiateur fonte renove ou design", prix_min: 800, prix_max: 1500 },
    ],
    economies: [
      "Acheter le radiateur soi-meme et faire poser",
      "Profiter d'un changement de chaudiere pour grouper les depose/pose",
      "Vannes thermostatiques : economie 10 a 15 pourcents sur la facture",
    ],
    faq: [
      { q: "Acier ou alu, lequel chauffe le mieux ?", r: "Alu chauffe plus vite mais retient moins. Acier : meilleur rendement sur la duree." },
      { q: "Plinthe ou panneau ?", r: "Plinthe : adapte aux pieces longues. Panneau classique : plus repandu, moins cher." },
      { q: "Combien de radiateurs pour 100 m2 ?", r: "5 a 7 radiateurs selon isolation. 100 W/m2 en moyenne pour pavillon des annees 80." },
    ],
    source: { label: "Capeb statistiques chauffage", url: "https://www.capeb.fr/" },
  },

  // ============================================================
  // PLAQUISTE
  // ============================================================
  {
    slug: "pose-cloison-placo",
    metier: "plaquiste",
    nom: "Pose cloison placo",
    accroche: "BA13 standard, hydro pour pieces humides, phonique : le m2 varie du simple au double.",
    prix_min: 40,
    prix_max: 110,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Hauteur de cloison",
      "Type de plaque : standard, hydrofuge, phonique, ignifuge",
      "Isolation interieure (laine minerale)",
      "Finition (bandes, enduit, peinture)",
    ],
    variantes: [
      { nom: "BA13 standard avec laine de verre", prix_min: 40, prix_max: 70 },
      { nom: "BA13 hydrofuge salle de bain", prix_min: 55, prix_max: 90 },
      { nom: "BA13 phonique double couche", prix_min: 80, prix_max: 110 },
    ],
    economies: [
      "Realiser plusieurs cloisons sur un meme chantier",
      "Acheter les plaques en grandes surfaces de bricolage",
      "Eviter les arrondis et niches (sur-cout important)",
    ],
    faq: [
      { q: "Cloison porteuse possible ?", r: "Non, le placo est non porteur. Les cloisons porteuses sont en parpaing ou brique." },
      { q: "Combien de temps de pose ?", r: "1 jour pour 10 m2 cloison standard, finition incluse." },
      { q: "Mur ou cloison, quelle difference ?", r: "Mur : porteur. Cloison : sans charge, simple separation. Placo = cloison toujours." },
    ],
    source: { label: "Federation Francaise du Batiment plaquistes", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "faux-plafond-suspendu",
    metier: "plaquiste",
    nom: "Faux plafond suspendu",
    accroche: "Cache-canalisations, isolation phonique, eclairage encastre : un poste a 50-90 euros au m2.",
    prix_min: 40,
    prix_max: 100,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Type : suspendu sur ossature ou colle",
      "Hauteur d'ossature (10 a 30 cm)",
      "Type de plaque (standard, phonique)",
      "Eclairage integre (spots LED)",
    ],
    variantes: [
      { nom: "Plafond suspendu standard", prix_min: 40, prix_max: 70 },
      { nom: "Plafond phonique double couche", prix_min: 60, prix_max: 90 },
      { nom: "Plafond avec spots integres", prix_min: 80, prix_max: 100, note: "Hors travaux electriques" },
    ],
    economies: [
      "Privilegier des spots LED encastrables standards (Bricoman, Castorama)",
      "Conserver hauteur sous plafond minimum 2,40 m (logement decent)",
      "Mutualiser avec un changement de cuisine ou salle de bain",
    ],
    faq: [
      { q: "Hauteur sous plafond minimum ?", r: "2,40 m (logement decent). 2,20 m possible mais derogation copro/PLU souvent necessaire." },
      { q: "Phonique ou thermique : que choisir ?", r: "Phonique : isole des bruits aeriens du voisinage. Thermique : combiner avec isolation toiture." },
      { q: "Spots LED : combien par m2 ?", r: "1 spot pour 1,5 a 2 m2 en eclairage general. 1 pour 1 m2 en cuisine/salle de bain." },
    ],
    source: { label: "Capeb plaquistes", url: "https://www.capeb.fr/" },
  },
  {
    slug: "doublage-isolation-mur",
    metier: "plaquiste",
    nom: "Doublage isolation interieure (ITI)",
    accroche: "Solution la plus simple en renovation : pose contre mur, plaque + isolant intermediaire.",
    prix_min: 45,
    prix_max: 110,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Type de doublage : colle ou sur ossature",
      "Epaisseur isolant (60 a 200 mm)",
      "Resistance thermique R cible",
      "Reprise de tableaux de fenetres",
    ],
    variantes: [
      { nom: "Doublage colle PSE 100 mm", prix_min: 45, prix_max: 70 },
      { nom: "Doublage ossature laine 120 mm", prix_min: 65, prix_max: 90 },
      { nom: "Doublage laine de bois 160 mm", prix_min: 90, prix_max: 110 },
    ],
    economies: [
      "MaPrimeRenov' Mur Interieur : 15 a 25 euros/m2",
      "CEE : 5 a 10 euros/m2",
      "Verifier presence de moisissures avant doublage (sinon traitement prealable)",
    ],
    faq: [
      { q: "ITE ou ITI : que privilegier ?", r: "ITE : meilleur thermiquement, plus cher. ITI : plus simple, perte de surface interieure." },
      { q: "Pare-vapeur necessaire ?", r: "Oui systematiquement cote chaud, sinon condensation et moisissures dans isolant." },
      { q: "Quelle epaisseur pour atteindre BBC ?", r: "Minimum 120 mm de laine + 13 mm placo, ou 100 mm de PSE." },
    ],
    source: { label: "France Renov' isolation interieure", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-murs-interieur" },
  },
  {
    slug: "isolation-acoustique-piece",
    metier: "plaquiste",
    nom: "Isolation acoustique d'une piece",
    accroche: "Reduire le bruit aerien d'une chambre voisine : doublage phonique + traitement plafond.",
    prix_min: 80,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface a traiter (4 murs + plafond)",
      "Niveau d'attenuation cible (Rw en dB)",
      "Pose sur ossature desolidarisee",
      "Reprise des prises et interrupteurs",
    ],
    variantes: [
      { nom: "Doublage phonique simple BA13 phonique", prix_min: 80, prix_max: 120 },
      { nom: "Double cloison desolidarisee + laine roche", prix_min: 130, prix_max: 180 },
      { nom: "Studio/home cinema (mur masse-ressort-masse)", prix_min: 200, prix_max: 350, note: "Niveau professionnel" },
    ],
    economies: [
      "Identifier les bruits dominants (aerien ou impact) avant d'investir",
      "Bouchage des passages de cables et prises (souvent ponts phoniques)",
      "Privilegier double-couche placo plutot que triple",
    ],
    faq: [
      { q: "Differentier bruit aerien et bruit d'impact ?", r: "Aerien : voix, TV, traverse les cloisons. Impact : pas, chocs, traverse le plancher." },
      { q: "Affaiblissement Rw, quel niveau viser ?", r: "Rw plus de 40 dB pour cloisons, plus de 50 dB pour studios musique." },
      { q: "L'isolation thermique aide-t-elle au phonique ?", r: "Oui partiellement (laine minerale). Mais pas suffisant pour bruits forts (musique, voix elevee)." },
    ],
    source: { label: "Centre Information Bruit (CIDB) guide isolation", url: "https://www.bruit.fr/" },
  },

  // ============================================================
  // CARRELEUR
  // ============================================================
  {
    slug: "pose-carrelage-sol",
    metier: "carreleur",
    nom: "Pose carrelage au sol",
    accroche: "Pose seule 30 a 80 euros au m2 + fourniture de 20 a 100 euros au m2.",
    prix_min: 50,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Format des carreaux (petit, moyen, XXL)",
      "Type de pose : droite, en quinconce, diagonale, motif",
      "Etat du support (chape ou ragreage prealable)",
      "Joint epoxy ou ciment",
    ],
    variantes: [
      { nom: "Gres cerame standard 30x60", prix_min: 50, prix_max: 90 },
      { nom: "Gres cerame imitation parquet 20x120", prix_min: 70, prix_max: 130 },
      { nom: "Carrelage XXL 80x80 ou 120x120", prix_min: 100, prix_max: 180, note: "Pose plus delicate, planeite exigee" },
    ],
    economies: [
      "Acheter le carrelage en gros chez Bricoman, Brico Depot",
      "Choisir formats standards (30x60, 60x60) pour eviter les surcouts pose",
      "Eviter les motifs en pose diagonale (10 a 15 pourcents en plus)",
    ],
    faq: [
      { q: "Combien de chute prevoir a l'achat ?", r: "10 pourcents en pose droite, 15 pourcents en diagonale ou motif." },
      { q: "Carrelage exterieur : quelle norme ?", r: "Classement R10 minimum (antiderapant), gel A1+ pour climat continental." },
      { q: "Combien de temps de chantier ?", r: "1,5 a 2 jours pour 20 m2 (incluant joint), une journee de sechage avant utilisation." },
    ],
    source: { label: "Capeb metiers carreleurs", url: "https://www.capeb.fr/" },
  },
  {
    slug: "pose-faience-mur",
    metier: "carreleur",
    nom: "Pose faience murale",
    accroche: "Cuisine, salle de bain : 40 a 90 euros au m2 pose seule, hors fourniture.",
    prix_min: 35,
    prix_max: 90,
    unite: "m2",
    inclus: "pose-seule",
    facteurs: [
      "Format de faience (petit, mosaique, grand)",
      "Surface a couvrir et nombre de pieces a couper",
      "Type de pose (droite, brique, motif)",
      "Joints colores ou epoxy",
    ],
    variantes: [
      { nom: "Faience standard 25x40", prix_min: 35, prix_max: 55 },
      { nom: "Faience grand format 30x90", prix_min: 50, prix_max: 75 },
      { nom: "Mosaique sur trame", prix_min: 70, prix_max: 90 },
    ],
    economies: [
      "Limiter mosaique aux zones decoratives (frises, niches)",
      "Acheter quelques carreaux supplementaires pour SAV futur",
      "Faience entree de gamme : aspect identique au superieur sur grandes surfaces",
    ],
    faq: [
      { q: "Faut-il un primaire d'accrochage ?", r: "Oui obligatoire avant pose mortier-colle, surtout sur placo et beton lisse." },
      { q: "Joints epoxy ou ciment ?", r: "Epoxy : etanche, cher (40 euros/sac), recommande douche. Ciment : standard, a renover tous les 5 ans." },
      { q: "Faience vintage et coupes precises ?", r: "Comptez 50 a 100 euros supplementaires pour formats irreguliers ou motifs alignes." },
    ],
    source: { label: "Federation Francaise du Batiment carreleurs", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "carrelage-grand-format",
    metier: "carreleur",
    nom: "Pose carrelage grand format (XXL)",
    accroche: "60x60, 80x80, 120x60 ou plus : pose plus chere mais rendu architectural.",
    prix_min: 80,
    prix_max: 200,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Taille des dalles (60x60 a 160x320)",
      "Etat du support (planeite tres exigeante)",
      "Joint mince 2 mm (necessite double encollage)",
      "Decoupe diamant (formats lourds)",
    ],
    variantes: [
      { nom: "60x60 effet beton", prix_min: 80, prix_max: 120 },
      { nom: "80x80 imitation marbre", prix_min: 100, prix_max: 160 },
      { nom: "120x60 ou plus (effet pierre)", prix_min: 130, prix_max: 200 },
    ],
    economies: [
      "Verifier la planeite du support avant achat (ragreage souvent obligatoire)",
      "Comparer carrelage premium vs effet en gres rectifie (50 pourcents moins cher)",
      "Eviter les coupes complexes (cercles, courbes)",
    ],
    faq: [
      { q: "Pourquoi plus cher que le standard ?", r: "Manipulation a 2 personnes, ventouses speciales, planeite + ou - 1 mm/m exigee." },
      { q: "Joint de quelle epaisseur ?", r: "2 mm minimum (norme NF DTU 52.2). Le rectifie permet jusqu'a 1 mm." },
      { q: "Risque de fissure ?", r: "Oui si support instable. Joint de fractionnement obligatoire tous les 8 m." },
    ],
    source: { label: "CSTB norme NF DTU 52.2 carrelage", url: "https://www.cstb.fr/" },
  },
  {
    slug: "ragreage-sol",
    metier: "carreleur",
    nom: "Ragreage de sol",
    accroche: "Avant pose carrelage, parquet ou linoleum : indispensable si support irregulier.",
    prix_min: 15,
    prix_max: 45,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Epaisseur du ragreage (auto-lissant 3-10 mm, fibre 10-30 mm)",
      "Etat du support (chape, ancien carrelage, parquet)",
      "Surface a traiter",
      "Primaire d'accrochage indispensable",
    ],
    variantes: [
      { nom: "Auto-lissant 3-10 mm", prix_min: 15, prix_max: 25 },
      { nom: "Fibre 10-20 mm", prix_min: 25, prix_max: 35 },
      { nom: "Mortier de redressement plus de 20 mm", prix_min: 35, prix_max: 45 },
    ],
    economies: [
      "Mutualiser avec la pose carrelage du meme artisan",
      "Acheter le sac de ragreage en grande surface (20 a 30 euros)",
      "Eviter ragreage si difference de niveau plus de 30 mm (prevoir chape complete)",
    ],
    faq: [
      { q: "Quelle epaisseur maximale possible ?", r: "30 mm pour le fibre, au-dela : chape liquide ou ciment classique." },
      { q: "Sechage avant pose carrelage ?", r: "24 h a 48 h selon epaisseur et temperature ambiante." },
      { q: "Sur parquet existant possible ?", r: "Oui avec primaire d'accrochage specifique et fibres. Mais souvent depose preferable." },
    ],
    source: { label: "CSTB ragreage", url: "https://www.cstb.fr/" },
  },

  // ============================================================
  // PEINTRE
  // ============================================================
  {
    slug: "peinture-mur-piece",
    metier: "peintre",
    nom: "Peinture murs et plafonds piece",
    accroche: "Mise en peinture totale d'une piece : 25 a 50 euros au m2 fini.",
    prix_min: 25,
    prix_max: 60,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Etat des murs (sain, fissure, moisi)",
      "Nombre de couches (1 ou 2)",
      "Qualite de la peinture (entree, mat, satin, lessivable)",
      "Travaux preparatoires (rebouchage, ponce, sous-couche)",
    ],
    variantes: [
      { nom: "Mur sain, peinture mat 2 couches", prix_min: 25, prix_max: 35 },
      { nom: "Mur fissure : enduit de rebouchage + peinture", prix_min: 35, prix_max: 50 },
      { nom: "Peinture decorative ou velours", prix_min: 50, prix_max: 60 },
    ],
    economies: [
      "Demander un devis detaillant les m2 de plafond et de mur (eviter les forfaits flous)",
      "Acheter peinture haut de gamme : meilleur rendu, moins de couches",
      "Lit/dressing dehors permet de gagner 1 a 2 heures de protection",
    ],
    faq: [
      { q: "Combien de couches necessaires ?", r: "2 minimum sur mur peint, 3 si changement clair vers fonce." },
      { q: "Acrylique ou glycero ?", r: "Acrylique : standard, eco, sans odeur. Glycero : tres lessivable, salles de bain et cuisine." },
      { q: "Combien de temps pour 20 m2 ?", r: "2 a 3 jours selon preparation. Peinture pure : 1 jour pour 50 m2." },
    ],
    source: { label: "Capeb peintres", url: "https://www.capeb.fr/" },
  },
  {
    slug: "peinture-facade",
    metier: "peintre",
    nom: "Peinture facade exterieure",
    accroche: "Pliolite, siloxane, hydropliolite : la duree de tenue varie de 5 a 20 ans.",
    prix_min: 30,
    prix_max: 90,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Etat de la facade (saine, fissuree, moussue)",
      "Type de peinture (pliolite 5-7 ans, siloxane 15-20 ans)",
      "Acces : echelle ou echafaudage",
      "Hauteur du batiment et nombre de niveaux",
    ],
    variantes: [
      { nom: "Pliolite economique R3", prix_min: 30, prix_max: 50 },
      { nom: "Hydropliolite R4 (10 ans)", prix_min: 45, prix_max: 65 },
      { nom: "Siloxane premium R6 (20 ans)", prix_min: 70, prix_max: 90 },
    ],
    economies: [
      "Mutualiser avec demoussage (deja prevu echafaudage)",
      "Faire en automne (artisans plus disponibles)",
      "Comparer 3 devis sur prix au m2 et certification CEKAL",
    ],
    faq: [
      { q: "Faut-il declarer en mairie ?", r: "Oui si modification de couleur (declaration prealable de travaux)." },
      { q: "Combien de temps de chantier ?", r: "5 a 10 jours pour 200 m2 facade selon meteo et etat." },
      { q: "Garantie sur la peinture ?", r: "Decennale obligatoire. Tenue siloxane premium 20 ans en condition normale." },
    ],
    source: { label: "Federation Francaise du Batiment peintres", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "peinture-decorative",
    metier: "peintre",
    nom: "Peinture decorative et finitions",
    accroche: "Patine, beton cire, tadelakt, stuc : effet matiere et finition unique.",
    prix_min: 40,
    prix_max: 250,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Technique : patine, faux marbre, beton cire, tadelakt",
      "Surface a traiter",
      "Travaux preparatoires (toujours plus exigeants)",
      "Niveau d'expertise de l'artisan",
    ],
    variantes: [
      { nom: "Effet ferro ou velours", prix_min: 40, prix_max: 80 },
      { nom: "Beton cire", prix_min: 80, prix_max: 130 },
      { nom: "Tadelakt traditionnel", prix_min: 150, prix_max: 250, note: "Hammam, salle de bain, douche italienne" },
    ],
    economies: [
      "Limiter zones decoratives (mur de fond, niche, cuisine)",
      "Privilegier peintures effet plutot que techniques anciennes (10 fois moins cher)",
      "Verifier portfolio artisan (decoratif tres different du peintre standard)",
    ],
    faq: [
      { q: "Tadelakt en cuisine, est-ce possible ?", r: "Oui, c'est meme un usage traditionnel marocain. Necessite finition au savon noir." },
      { q: "Beton cire compatible carrelage ?", r: "Oui en recouvrement avec primaire. Sur faiences existantes : sechage 3 a 5 jours par couche." },
      { q: "Garantie sur ces finitions ?", r: "Garantie decennale, mais entretien et patine dans le temps a anticiper (verre cire annuel)." },
    ],
    source: { label: "Cnaib metiers d'art peinture", url: "https://www.institut-metiersdart.org/" },
  },
  {
    slug: "ravalement-facade",
    metier: "peintre",
    nom: "Ravalement facade complet",
    accroche: "Nettoyage + reparation + enduit + peinture : obligatoire tous les 10 ans dans certaines communes.",
    prix_min: 40,
    prix_max: 110,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Etat initial (fissures, mousse, decollement)",
      "Type de support (enduit, brique, pierre)",
      "Methode de nettoyage (haute pression, sablage, gommage)",
      "Materiau de finition (peinture, RPE, enduit)",
    ],
    variantes: [
      { nom: "Nettoyage + peinture pliolite", prix_min: 40, prix_max: 60 },
      { nom: "Reparation fissures + RPE projete", prix_min: 60, prix_max: 85 },
      { nom: "Refection enduit complet + finition", prix_min: 85, prix_max: 110 },
    ],
    economies: [
      "MaPrimeRenov' Mur Exterieur : couplage avec ITE possible",
      "Subvention Anah pour menages tres modestes",
      "Mutualiser avec les voisins (copropriete) pour reduire frais d'echafaudage",
    ],
    faq: [
      { q: "Le ravalement est-il obligatoire ?", r: "Tous les 10 ans dans 130 communes (loi 1903). Verifier en mairie." },
      { q: "Peut-on isoler en meme temps ?", r: "Oui, isolation thermique par l'exterieur (ITE) couplee au ravalement = meilleur ROI." },
      { q: "Combien de temps de chantier ?", r: "3 a 6 semaines pour 200 m2 facade, hors meteo defavorable." },
    ],
    source: { label: "ANAH aides ravalement", url: "https://www.anah.fr/" },
  },

  // ============================================================
  // SERRURIER
  // ============================================================
  {
    slug: "depannage-serrure",
    metier: "serrurier",
    nom: "Depannage serrure (ouverture porte)",
    accroche: "Tarif legal encadre : se mefier des arnaques, exiger devis avant intervention.",
    prix_min: 90,
    prix_max: 350,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Type d'ouverture (manipulation, percement, crochetage)",
      "Heure : jour, nuit (22h-6h), week-end ou ferie",
      "Frais de deplacement",
      "Si necessite remplacement du cylindre",
    ],
    variantes: [
      { nom: "Ouverture sans degat (jour ouvre)", prix_min: 90, prix_max: 180 },
      { nom: "Ouverture avec changement cylindre", prix_min: 180, prix_max: 350 },
      { nom: "Intervention nuit/dimanche/ferie", prix_min: 220, prix_max: 500, note: "Majoration legale jusqu'a 100 pourcents" },
    ],
    economies: [
      "Exiger devis ecrit avant intervention (obligation legale plus de 100 euros)",
      "Mefiance sur les flyers et publicites trompeuses (surfacturation)",
      "Verifier numero SIRET sur sirene.gouv.fr avant rendez-vous",
    ],
    faq: [
      { q: "Faut-il forcement appeler ?", r: "Tester d'abord : un voisin avec passe peut souvent ouvrir. Sinon serrurier uniquement officielle." },
      { q: "Quels recours en cas de surfacturation ?", r: "Saisir DGCCRF (signalconso.fr) et Banque de France si paiement carte." },
      { q: "Quel risque sans certificat A2P ?", r: "Beaucoup de serrures \"securite\" non certifiees A2P se font crocheter en moins de 3 minutes." },
    ],
    source: { label: "DGCCRF arnaques serruriers", url: "https://www.economie.gouv.fr/dgccrf/Publications" },
  },
  {
    slug: "changement-cylindre",
    metier: "serrurier",
    nom: "Changement de cylindre",
    accroche: "Apres effraction, perte de cles ou achat : 150 a 400 euros pour un cylindre certifie A2P.",
    prix_min: 150,
    prix_max: 500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Marque et niveau de certification (A2P 1, 2 ou 3 etoiles)",
      "Nombre de cles",
      "Cylindre simple ou double entree",
      "Type de serrure (1, 3, 5 ou 7 points)",
    ],
    variantes: [
      { nom: "Cylindre standard avec 3 cles", prix_min: 150, prix_max: 250 },
      { nom: "Cylindre A2P 1 etoile", prix_min: 220, prix_max: 350 },
      { nom: "Cylindre A2P 3 etoiles haute securite", prix_min: 300, prix_max: 500 },
    ],
    economies: [
      "Acheter cylindre soi-meme (Bricoman, Castorama) et faire poser",
      "Cles supplementaires : 8 a 30 euros (selon brevet)",
      "Decote assurance habitation 5 a 10 pourcents pour A2P 3 etoiles",
    ],
    faq: [
      { q: "Que mesure A2P 1, 2 ou 3 etoiles ?", r: "Resistance a l'effraction : 1 = 5 min, 2 = 10 min, 3 = 15 min (test laboratoire CNPP)." },
      { q: "Cylindre brevete vs standard : difference ?", r: "Brevete = cles non reproductibles sans carte de propriete. Standard : reproductibles partout." },
      { q: "Faut-il changer apres deces du proprietaire ?", r: "Bonne pratique pour les heritiers, surtout si cles ont circule (artisans, employes de maison)." },
    ],
    source: { label: "CNPP certification A2P serrures", url: "https://www.cnpp.com/" },
  },
  {
    slug: "porte-blindee",
    metier: "serrurier",
    nom: "Pose porte blindee",
    accroche: "Niveau anti-effraction du A2P 1 etoile au A2P 3 etoiles : un investissement long terme.",
    prix_min: 1500,
    prix_max: 5500,
    unite: "u",
    inclus: "tout-compris",
    facteurs: [
      "Niveau de certification A2P (BP1, BP2, BP3)",
      "Type : porte bouclier, blindage installe, blindee complete",
      "Nombre de points de fermeture (3, 5 ou 7)",
      "Materiau et finition (bois, alu, acier)",
    ],
    variantes: [
      { nom: "Porte blindee A2P BP1 5 points", prix_min: 1500, prix_max: 2500 },
      { nom: "Porte A2P BP2 7 points", prix_min: 2500, prix_max: 3500 },
      { nom: "Porte A2P BP3 7 points haut de gamme", prix_min: 3500, prix_max: 5500 },
    ],
    economies: [
      "Verifier remise assurance habitation (jusqu'a 15 pourcents) avec A2P",
      "Bouclier seul (porte existante conservee) : moitie du prix",
      "Choisir marque francaise (Picard, Fichet) pour SAV reactif",
    ],
    faq: [
      { q: "Mon HLM autorise-t-il une porte blindee ?", r: "Oui, locataire peut installer une porte blindee a ses frais. Bailleur doit accepter, sauf clause stricte." },
      { q: "Combien de temps pour la pose ?", r: "Une journee complete pour une porte blindee complete avec batterie." },
      { q: "Garantie incluse ?", r: "Decennale obligatoire + garantie 5 ans constructeur sur la mecanique." },
    ],
    source: { label: "GIPS pose portes blindees normes", url: "https://www.gips.fr/" },
  },
  {
    slug: "coffre-fort-installation",
    metier: "serrurier",
    nom: "Installation coffre-fort",
    accroche: "Coffre encastre, a poser, ignifuge : la certification (NF EN 1143-1) fait la difference.",
    prix_min: 300,
    prix_max: 3500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Volume et poids du coffre (10 a 200 litres)",
      "Niveau de securite (Niveau 0 a 6, NF EN 1143-1)",
      "Type d'installation (a sceller, encastre, mural)",
      "Ouverture : cle, code, biometrie",
    ],
    variantes: [
      { nom: "Coffre 30 L a code, niveau 0", prix_min: 300, prix_max: 700 },
      { nom: "Coffre encastre niveau 1 ignifuge", prix_min: 800, prix_max: 1500 },
      { nom: "Coffre haute securite niveau 3+", prix_min: 1800, prix_max: 3500 },
    ],
    economies: [
      "Comparer assurance habitation (couverture bijoux/especes selon niveau coffre)",
      "Verifier conformite ECB.S avant achat",
      "Coffre a poser : moins cher mais visible (a fixer 200 mm sol)",
    ],
    faq: [
      { q: "Niveau de coffre pour 50 000 euros bijoux ?", r: "NF EN 1143-1 niveau 1 minimum. Niveau 3+ pour valeurs superieures." },
      { q: "Combien de temps installation encastre ?", r: "Une demi-journee a une journee selon scellement (beton, parpaing)." },
      { q: "Code numerique ou cle ?", r: "Code : pratique. Cle : plus sur (pas de batterie a remplacer). Mixte : combine les deux." },
    ],
    source: { label: "ECBS European Certification Body Safes", url: "https://www.ecb-s.com/" },
  },

  // ============================================================
  // MACON
  // ============================================================
  {
    slug: "mur-parpaing",
    metier: "macon",
    nom: "Mur en parpaing au m2",
    accroche: "Cloison ou mur porteur : 80 a 150 euros au m2 selon epaisseur et hauteur.",
    prix_min: 80,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Epaisseur du parpaing (15, 20, 25 cm)",
      "Hauteur du mur (jusqu'a 2,5 m, plus de 3 m)",
      "Chainage horizontal et vertical",
      "Enduit de finition (cote interieur, exterieur)",
    ],
    variantes: [
      { nom: "Cloison parpaing 15 cm", prix_min: 80, prix_max: 120 },
      { nom: "Mur porteur parpaing 20 cm", prix_min: 110, prix_max: 160 },
      { nom: "Mur de soutenement parpaing 25 cm + chainage", prix_min: 140, prix_max: 180 },
    ],
    economies: [
      "Acheter le parpaing en gros au depot (Point P, Bigmat) plutot qu'en grande surface",
      "Reserver le chainage uniquement au necessaire (norme NF DTU 20.1)",
      "Eviter les arrondis et angles fantaisistes (sur-cout important)",
    ],
    faq: [
      { q: "Mur porteur ou non ?", r: "Mur porteur supporte plancher/toiture, fondations renforcees. Cloison : aucun role structurel." },
      { q: "Faut-il un permis ?", r: "Pour mur de cloture plus de 2 m ou mur exterieur : declaration prealable obligatoire." },
      { q: "Parpaing ou brique ?", r: "Parpaing : plus rapide, moins cher. Brique monomur : plus isolant, plus cher." },
    ],
    source: { label: "FFB Federation maconnerie", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "dalle-beton",
    metier: "macon",
    nom: "Dalle beton au m2",
    accroche: "Garage, terrasse, fondation legere : 40 a 90 euros au m2 selon epaisseur et armature.",
    prix_min: 40,
    prix_max: 110,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Epaisseur (10, 15, 20 cm)",
      "Armature : treillis simple, double, fibres metalliques",
      "Type de finition (lisse, talochee, balaye)",
      "Acces du chantier (toupie ou betonniere manuelle)",
    ],
    variantes: [
      { nom: "Dalle 12 cm treillis simple (terrasse)", prix_min: 40, prix_max: 65 },
      { nom: "Dalle 15 cm treillis double (garage)", prix_min: 60, prix_max: 90 },
      { nom: "Dalle 20 cm fibres metalliques (industriel)", prix_min: 90, prix_max: 110 },
    ],
    economies: [
      "Faire venir une toupie pour grandes surfaces (plus de 30 m2)",
      "Eviter le hourdis : moins solide, plus cher pour grandes surfaces",
      "Comparer beton dose vs pre-melange en sac (volume)",
    ],
    faq: [
      { q: "Combien de temps de sechage ?", r: "Marche apres 24 h, pose carrelage apres 21 jours, charge complete apres 28 jours." },
      { q: "Renforcement obligatoire ?", r: "Treillis a 5x5 cm minimum sous dalle plus de 6 m2. Double treillis pour grandes portees." },
      { q: "Puis-je faire moi-meme ?", r: "Oui pour terrasses jusqu'a 20 m2 avec equipement. Au-dela : maconnerie professionnelle pour garantie decennale." },
    ],
    source: { label: "Cstb dalles beton norme NF DTU 13.3", url: "https://www.cstb.fr/" },
  },
  {
    slug: "terrasse-beton",
    metier: "macon",
    nom: "Terrasse en beton au m2",
    accroche: "Sous abri, exposee, sur vide : la fourchette monte avec drainage et finition.",
    prix_min: 60,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface de la terrasse",
      "Sur dalle pleine ou sur plots",
      "Type de finition (beton lisse, beton imprime, beton cire)",
      "Etancheite et drainage",
    ],
    variantes: [
      { nom: "Beton lisse 15 cm", prix_min: 60, prix_max: 110 },
      { nom: "Beton imprime decoratif", prix_min: 110, prix_max: 150 },
      { nom: "Beton cire exterieur", prix_min: 130, prix_max: 180 },
    ],
    economies: [
      "Eviter beton imprime fantaisie : a refaire 2 fois pour eviter usure",
      "Privilegier dalle pleine plutot que plots si terrain stable",
      "Couler en saison seche, eviter automne pluvieux",
    ],
    faq: [
      { q: "Faut-il un permis pour terrasse ?", r: "Plus de 5 m2 (40 m2 si dans zone constructible et hauteur plus de 60 cm) : declaration prealable." },
      { q: "Drainage obligatoire ?", r: "Pente de 1 a 2 pourcents minimum vers exterieur ou caniveau." },
      { q: "Carrelage exterieur sur beton frais ?", r: "Attendre 28 jours sechage complet, primaire d'accrochage obligatoire." },
    ],
    source: { label: "ANAH terrasse exterieure normes", url: "https://www.anah.fr/" },
  },
  {
    slug: "enduit-facade",
    metier: "macon",
    nom: "Enduit de facade au m2",
    accroche: "Monocouche, traditionnel ou chaux : la difference se fait sur la respirabilite et l'aspect.",
    prix_min: 30,
    prix_max: 80,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Etat initial de la facade (sain, fissure)",
      "Type d'enduit (monocouche, gratte, chaux, RPE)",
      "Surface et hauteur (echafaudage)",
      "Couleur (blanc casse standard, teinte ATV)",
    ],
    variantes: [
      { nom: "Enduit monocouche projete", prix_min: 30, prix_max: 50 },
      { nom: "Enduit gratte traditionnel", prix_min: 45, prix_max: 65 },
      { nom: "Enduit chaux respirant (maisons anciennes)", prix_min: 60, prix_max: 80 },
    ],
    economies: [
      "Mutualiser avec ravalement (echafaudage deja en place)",
      "Eviter teintes au-dela ATV30 (sur-cout 5 a 15 pourcents)",
      "Privilegier enduit chaux pour maisons en pierre (compatible respiration)",
    ],
    faq: [
      { q: "Quelle saison pour enduire ?", r: "Avril a septembre, hors gel et meteo pluvieuse pour 7 jours minimum." },
      { q: "Enduit vs peinture facade ?", r: "Enduit : couche epaisse 8 a 15 mm, masque defauts. Peinture : couche fine, sur enduit existant uniquement." },
      { q: "Garantie sur l'enduit ?", r: "Decennale obligatoire (loi Spinetta), tenue couleur 15 a 20 ans selon expose." },
    ],
    source: { label: "Capeb enduits facade", url: "https://www.capeb.fr/" },
  },

  // ============================================================
  // JARDINIER
  // ============================================================
  {
    slug: "entretien-jardin-mensuel",
    metier: "jardinier",
    nom: "Entretien mensuel du jardin",
    accroche: "Tonte, taille, desherbage : forfait mensuel ou paiement a l'heure (40 a 70 euros).",
    prix_min: 40,
    prix_max: 80,
    unite: "h",
    inclus: "tout-compris",
    facteurs: [
      "Surface du jardin",
      "Type de prestation (tonte, taille, desherbage)",
      "Frequence (1 a 4 fois par mois)",
      "Materiel inclus ou non",
    ],
    variantes: [
      { nom: "Tonte simple (1 h pour 200 m2)", prix_min: 40, prix_max: 60 },
      { nom: "Forfait mensuel jardin 500 m2", prix_min: 200, prix_max: 350, note: "4 visites/mois" },
      { nom: "Contrat annuel jardin 1000 m2", prix_min: 1500, prix_max: 3000, note: "Mensualisation possible" },
    ],
    economies: [
      "Credit d'impot Service a la Personne : 50 pourcents jusqu'a 5000 euros par an",
      "Demander artisan declare (Cesu, organisme agree)",
      "Mutualiser avec voisins (deplacement reparti)",
    ],
    faq: [
      { q: "Le credit d'impot est-il valable ?", r: "Oui pour entretien jardin chez particulier (article 199 sexdecies CGI). Plafond : 5000 euros/an." },
      { q: "Materiel a fournir ?", r: "Selon contrat. Forfait \"tout compris\" : artisan apporte tondeuse, taille-haie, debroussailleuse." },
      { q: "Quelle frequence pour pelouse ?", r: "1 fois/semaine en saison (avril-octobre), 2 fois/mois en hiver pour bordures." },
    ],
    source: { label: "Service public credit impot SAP", url: "https://www.service-public.fr/particuliers/vosdroits/F12330" },
  },
  {
    slug: "elagage-arbre",
    metier: "jardinier",
    nom: "Elagage arbre",
    accroche: "Du tilleul du fond au pin de 25 m : prix variable du simple au sextuple selon hauteur.",
    prix_min: 200,
    prix_max: 2000,
    unite: "arbre",
    inclus: "tout-compris",
    facteurs: [
      "Hauteur de l'arbre (8 a 30 m)",
      "Volume des branches a couper",
      "Acces (rue, jardin, sur toiture)",
      "Evacuation des dechets verts",
    ],
    variantes: [
      { nom: "Arbre fruitier 4-8 m", prix_min: 200, prix_max: 400 },
      { nom: "Arbre 10-15 m", prix_min: 400, prix_max: 800 },
      { nom: "Arbre 15-25 m + nacelle", prix_min: 800, prix_max: 2000 },
    ],
    economies: [
      "Credit d'impot SAP 50 pourcents si entretien (pas elagage exceptionnel)",
      "Faire en automne ou hiver (saison morte, prix moins chers)",
      "Garder le bois pour cheminee/poele (economie chauffage)",
    ],
    faq: [
      { q: "Faut-il une autorisation ?", r: "Arbre remarquable (PLU) ou en bordure de voie publique : oui. Sinon non." },
      { q: "Periode pour elaguer ?", r: "Hors floraison, hors montee de seve. Octobre a fevrier ideal." },
      { q: "Risque pour les voisins ?", r: "Responsabilite civile artisan obligatoire. Verifier attestation avant intervention." },
    ],
    source: { label: "ONF guide elagage", url: "https://www.onf.fr/" },
  },
  {
    slug: "creation-haie",
    metier: "jardinier",
    nom: "Creation de haie de jardin",
    accroche: "Du laurier banal a la charmille architecturale : 80 a 300 euros au metre lineaire.",
    prix_min: 80,
    prix_max: 350,
    unite: "ml",
    inclus: "tout-compris",
    facteurs: [
      "Essence (laurier, charmille, troene, persistant)",
      "Hauteur cible (1, 2 ou 3 m)",
      "Densite de plantation",
      "Travaux de preparation du sol",
    ],
    variantes: [
      { nom: "Laurier hauteur 1 m, 1 plant/m", prix_min: 80, prix_max: 130 },
      { nom: "Charmille 1,5 m, 2 plants/m", prix_min: 130, prix_max: 220 },
      { nom: "Haie persistante mixte 2 m + plantation", prix_min: 220, prix_max: 350 },
    ],
    economies: [
      "Acheter en pepiniere locale plutot qu'en jardinerie",
      "Plants de 1 a 2 ans : moins chers, croissance rapide",
      "Demander un paillage minceral pour limiter desherbage",
    ],
    faq: [
      { q: "Quelle distance au mur du voisin ?", r: "0,5 m si haie moins de 2 m, 2 m sinon (article 671 Code Civil)." },
      { q: "Quand planter ?", r: "Octobre a mars (hors gel) pour plants en racines nues. Toute l'annee pour plants en pot." },
      { q: "Combien de temps pour atteindre 2 m ?", r: "Charmille : 5 ans. Laurier : 3 ans. Bambou : 2 ans (mais envahissant)." },
    ],
    source: { label: "Code Civil articles 671 a 673 plantations", url: "https://www.legifrance.gouv.fr/" },
  },
  {
    slug: "pose-pelouse-roulee",
    metier: "jardinier",
    nom: "Pose pelouse roulee",
    accroche: "Effet immediat : 8 a 18 euros au m2 fourniture et pose, contre 50 cents en semis.",
    prix_min: 8,
    prix_max: 25,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Surface (rabais des plus de 100 m2)",
      "Travaux de preparation (decompactage, terre vegetale)",
      "Qualite du gazon (ornement, sport, ombre)",
      "Reseau d'arrosage automatique en option",
    ],
    variantes: [
      { nom: "Gazon ornement standard", prix_min: 8, prix_max: 14 },
      { nom: "Gazon sport haute resistance", prix_min: 12, prix_max: 18 },
      { nom: "Pose + arrosage automatique", prix_min: 18, prix_max: 25 },
    ],
    economies: [
      "Semer plutot que poser : 0,5 a 2 euros/m2 mais 6 mois d'attente",
      "Faire en automne (sept-oct) ou printemps : meilleure reprise",
      "Acheter sur palette plutot que rouleau coupe (moins cher au m2)",
    ],
    faq: [
      { q: "Combien de temps avant utilisation ?", r: "2 a 3 semaines pour bien s'enraciner, eviter pietinement intense les 6 premieres semaines." },
      { q: "Arrosage necessaire ?", r: "Quotidien les 15 premiers jours, puis 2 fois/semaine en ete pendant la 1re annee." },
      { q: "Garantie sur la pelouse ?", r: "Reprise garantie 6 mois si arrosage suivi. Au-dela : entretien client uniquement." },
    ],
    source: { label: "INRAE pelouses gazons recherches", url: "https://www.inrae.fr/" },
  },

  // ============================================================
  // CLIMATICIEN
  // ============================================================
  {
    slug: "pose-climatisation-mono-split",
    metier: "climaticien",
    nom: "Pose climatisation mono-split",
    accroche: "Une piece a climatiser : 1500 a 3500 euros tout compris pour 2,5 a 5 kW.",
    prix_min: 1500,
    prix_max: 4000,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Puissance (2,5 / 3,5 / 5 kW)",
      "Distance entre unites (cuivre, percement)",
      "Marque et gamme",
      "Reversibilite (chauffage hiver)",
    ],
    variantes: [
      { nom: "2,5 kW reversible standard", prix_min: 1500, prix_max: 2500 },
      { nom: "3,5 kW marque premium (Daikin, Mitsubishi)", prix_min: 2500, prix_max: 3500 },
      { nom: "5 kW haute performance silencieuse", prix_min: 3500, prix_max: 4000 },
    ],
    economies: [
      "Eviter les marques low-cost (SAV difficile, fluide R32 indisponible)",
      "Pose hors saison (octobre a mars) : artisans plus disponibles, prix negociable",
      "Reversibilite incluse : peu de surcout mais economique en chauffage occasionnel",
    ],
    faq: [
      { q: "Faut-il un certificat fluides ?", r: "Oui pour l'artisan : Categorie 1 manipulation R32 (norme F-Gaz)." },
      { q: "Bruit de l'unite exterieure ?", r: "35 a 50 dB(A). Reglement copropriete et arrete prefectoral bruit a verifier." },
      { q: "Combien de temps de pose ?", r: "Une journee complete pour mono-split standard." },
    ],
    source: { label: "Afpa formations climaticien", url: "https://www.afpa.fr/" },
  },
  {
    slug: "pose-climatisation-multi-split",
    metier: "climaticien",
    nom: "Pose climatisation multi-split",
    accroche: "2 a 5 unites interieures sur une seule unite exterieure : economie d'echelle a partir de 3 pieces.",
    prix_min: 2500,
    prix_max: 9500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Nombre de splits interieurs (2 a 5)",
      "Puissance totale et longueur des liaisons cuivre",
      "Type d'unites interieures (mural, gainable, cassette)",
      "Reseau d'evacuation des condensats",
    ],
    variantes: [
      { nom: "Bi-split 2x2,5 kW", prix_min: 2500, prix_max: 4500 },
      { nom: "Tri-split 3x2,5 kW", prix_min: 3500, prix_max: 6000 },
      { nom: "Quadri-split 4x2,5 kW", prix_min: 5000, prix_max: 9500 },
    ],
    economies: [
      "Comparer multi-split et solution gainable centralisee",
      "Choisir taille unite exterieure adaptee (eviter sur-dimensionnement 30 pourcents)",
      "Mutualiser avec autres travaux (electricite, percement)",
    ],
    faq: [
      { q: "Multi-split ou plusieurs mono-splits ?", r: "Multi-split : 1 seule unite exterieure, plus esthetique. Mono : pannes ne propagent pas." },
      { q: "Tous les splits doivent-ils tourner en meme temps ?", r: "Oui, ou bien chaque piece independamment selon modeles. Mode chaud/froid simultane impossible (sauf VRV)." },
      { q: "Reglement de copropriete ?", r: "Demander accord prealable AG pour pose unite exterieure visible (facade, balcon, toiture)." },
    ],
    source: { label: "Cmiqs reglementation climatisation", url: "https://www.cmiqs.com/" },
  },
  {
    slug: "entretien-climatisation-annuel",
    metier: "climaticien",
    nom: "Entretien annuel climatisation",
    accroche: "Obligatoire pour clims plus de 4 kW : controle fluide, nettoyage, attestation.",
    prix_min: 100,
    prix_max: 250,
    unite: "annee",
    inclus: "tout-compris",
    facteurs: [
      "Nombre d'unites (mono, multi-split)",
      "Puissance totale",
      "Distance/region",
      "Type d'entretien (visite simple, contrat tout inclus)",
    ],
    variantes: [
      { nom: "Mono-split visite simple", prix_min: 100, prix_max: 150 },
      { nom: "Multi-split (3 unites) visite annuelle", prix_min: 150, prix_max: 220 },
      { nom: "Contrat annuel + reparations P2", prix_min: 220, prix_max: 350 },
    ],
    economies: [
      "Negocier visite a 2 ans (souvent suffisante en usage faible)",
      "Refuser changement filtres systematique a chaque visite",
      "Comparer 2 devis sur le meme contrat",
    ],
    faq: [
      { q: "L'entretien est-il vraiment obligatoire ?", r: "Oui pour clims plus de 4 kW (decret 2020-912). Tous les 2 ans." },
      { q: "Que se passe-t-il sans visite ?", r: "Performance baisse (filtres encrasses), garantie constructeur peut etre annulee." },
      { q: "Combien de temps prend l'entretien ?", r: "30 min a 1 h selon nombre d'unites et accessibilite." },
    ],
    source: { label: "Service public entretien climatisation", url: "https://www.service-public.fr/" },
  },
  {
    slug: "climatiseur-reversible",
    metier: "climaticien",
    nom: "Climatiseur reversible (chauffage et climatisation)",
    accroche: "L'option la plus rentable : 1800 a 4500 euros pour chauffer ET climatiser.",
    prix_min: 1800,
    prix_max: 4500,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Puissance (3,5 a 7 kW)",
      "Performances (COP en chauffage, EER en clim)",
      "Marque et gamme",
      "Connectivite (wifi, app)",
    ],
    variantes: [
      { nom: "3,5 kW reversible entree de gamme", prix_min: 1800, prix_max: 2500 },
      { nom: "5 kW reversible premium", prix_min: 2500, prix_max: 3500 },
      { nom: "7 kW haute performance silencieuse", prix_min: 3500, prix_max: 4500 },
    ],
    economies: [
      "Eligible CEE Coup de Pouce (50 a 200 euros) si remplacement chaudiere",
      "Choisir COP plus de 4 et EER plus de 3,5 (perf premium)",
      "Verifier garantie compresseur 10 ans (haut de gamme uniquement)",
    ],
    faq: [
      { q: "Aussi efficace qu'une PAC air-eau ?", r: "Pour chauffage seul : moins efficace. Pour combiner clim/chauffage occasionnel : excellent rapport qualite/prix." },
      { q: "Couvre-t-il toute la maison ?", r: "Non, max 60 m2 par unite interieure. Au-dela : multi-split ou gainable." },
      { q: "Eligible MaPrimeRenov' ?", r: "Plus depuis 2022 (climatiseurs reversibles seuls exclus). PAC air-eau seulement." },
    ],
    source: { label: "France Renov' chauffage", url: "https://france-renov.gouv.fr/aides/eligibilite/chauffage" },
  },

  // ============================================================
  // CUISINISTE
  // ============================================================
  {
    slug: "cuisine-equipee-standard",
    metier: "cuisiniste",
    nom: "Cuisine equipee standard",
    accroche: "Cuisine en kit poste, montee, electromenager : 3500 a 10 000 euros.",
    prix_min: 3500,
    prix_max: 12000,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Surface et lineaire",
      "Materiau facades (melamine, stratifie, laque)",
      "Plan de travail (stratifie, quartz, granit)",
      "Electromenager inclus (encastrable ou pose libre)",
    ],
    variantes: [
      { nom: "Cuisine 3 m IKEA-type", prix_min: 3500, prix_max: 6000 },
      { nom: "Cuisine 4 m moyen de gamme (Schmidt, Cuisinella)", prix_min: 6000, prix_max: 10000 },
      { nom: "Cuisine 5 m premium (Mobalpa, Bulthaup)", prix_min: 10000, prix_max: 12000 },
    ],
    economies: [
      "Acheter electromenager en gros chez Boulanger ou Darty",
      "Comparer 3 cuisinistes (devis 30 pourcents d'ecart possibles)",
      "Eviter laque brillante (entretien et SAV)",
    ],
    faq: [
      { q: "Cuisine montee ou en kit ?", r: "Kit IKEA : economie 30 pourcents mais 2 jours de montage. Montee : prix plus eleve mais delai 2 a 4 semaines." },
      { q: "Combien de temps de chantier ?", r: "Demolition + plomberie/electricite : 3-5 jours. Pose cuisine : 2-3 jours. Total 1 a 2 semaines." },
      { q: "Garantie sur la cuisine ?", r: "Decennale obligatoire sur l'installation. Constructeur : 2 ans (electromenager) a 10 ans (caissons)." },
    ],
    source: { label: "Federation des cuisinistes (FFC)", url: "https://www.fcc-france.fr/" },
  },
  {
    slug: "cuisine-sur-mesure",
    metier: "cuisiniste",
    nom: "Cuisine sur mesure haut de gamme",
    accroche: "Caissons 100 pourcents sur mesure, materiaux nobles, eclairage integre : 8000 a 30 000 euros.",
    prix_min: 8000,
    prix_max: 30000,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Lineaire et complexite (ilot, retours, niches)",
      "Materiaux nobles (chene, palmier, laque PU)",
      "Plan de travail (quartz Silestone, marbre)",
      "Electromenager haut de gamme (Miele, Gaggenau)",
    ],
    variantes: [
      { nom: "Cuisine 4 m + ilot, chene massif", prix_min: 8000, prix_max: 14000 },
      { nom: "Cuisine 5 m premium (Mobalpa, Schmidt)", prix_min: 14000, prix_max: 20000 },
      { nom: "Cuisine d'architecte (Bulthaup, Boffi)", prix_min: 20000, prix_max: 30000 },
    ],
    economies: [
      "Faire dessiner par cuisiniste mais executer par menuisier local (50 pourcents moins cher)",
      "Privilegier 1 ou 2 zones premium plutot que tout en haut de gamme",
      "Mutualiser avec changement de carrelage/sol (artisan deja sur place)",
    ],
    faq: [
      { q: "Combien de temps de fabrication ?", r: "8 a 12 semaines pour sur-mesure complet, parfois 16 semaines en haute saison." },
      { q: "Visite metreuse obligatoire ?", r: "Oui, devis sans visite chiffre approximatif. Metrage definitif apres signature." },
      { q: "Acompte au cuisiniste ?", r: "30 pourcents a la commande, 30 pourcents a la fabrication, 40 pourcents a la pose." },
    ],
    source: { label: "FCC Federation francaise des cuisinistes", url: "https://www.fcc-france.fr/" },
  },
  {
    slug: "ilot-central",
    metier: "cuisiniste",
    nom: "Ilot central de cuisine",
    accroche: "Element design et fonctionnel : 1500 a 7000 euros selon dimensions et integrations.",
    prix_min: 1500,
    prix_max: 8000,
    unite: "intervention",
    inclus: "tout-compris",
    facteurs: [
      "Dimensions (1,2 a 3 m)",
      "Integrations (hotte, plaque, evier, hood island)",
      "Materiau du plan de travail",
      "Branchement plomberie / electricite",
    ],
    variantes: [
      { nom: "Ilot 1,2 m simple (rangement)", prix_min: 1500, prix_max: 3000 },
      { nom: "Ilot 2 m avec evier ou plaque", prix_min: 3000, prix_max: 5000 },
      { nom: "Ilot 3 m avec hotte ilot et plan quartz", prix_min: 5000, prix_max: 8000 },
    ],
    economies: [
      "Eviter hotte ilot (1500 a 3000 euros, complexe)",
      "Choisir plan de travail en stratifie premium (3x moins cher que quartz)",
      "Garder cuisine standard et ajouter ilot en option",
    ],
    faq: [
      { q: "Quel passage minimum autour ?", r: "1 m minimum, 1,2 m recommande pour confort." },
      { q: "Plomberie sur ilot, c'est complexe ?", r: "Oui, necessite trous dalle ou passage en plenum. Compter 600 a 1500 euros surcout." },
      { q: "Hotte ilot vs hotte murale ?", r: "Hotte ilot 30 pourcents plus chere mais plus efficace pour grandes pieces ouvertes." },
    ],
    source: { label: "FCC ilots cuisine", url: "https://www.fcc-france.fr/" },
  },
  {
    slug: "plan-de-travail-quartz",
    metier: "cuisiniste",
    nom: "Plan de travail quartz",
    accroche: "Materiau premium : 250 a 700 euros au metre lineaire, anti-tache, anti-rayure.",
    prix_min: 250,
    prix_max: 800,
    unite: "ml",
    inclus: "tout-compris",
    facteurs: [
      "Marque (Silestone, Caesarstone, Compac)",
      "Couleur et finition (mat, polie, leather)",
      "Epaisseur (12 ou 20 mm)",
      "Decoupes (evier, plaque, prises)",
    ],
    variantes: [
      { nom: "Quartz 12 mm couleur standard", prix_min: 250, prix_max: 400 },
      { nom: "Quartz 20 mm finition mat ou leather", prix_min: 400, prix_max: 600 },
      { nom: "Quartz premium imitation marbre", prix_min: 600, prix_max: 800 },
    ],
    economies: [
      "Comparer 3 marbreries (devis a 30 pourcents d'ecart possibles)",
      "Eviter les couleurs rares ou en rupture (delai et surcout)",
      "Privilegier 12 mm sauf si overhang plus de 30 cm",
    ],
    faq: [
      { q: "Quartz vs granit : que choisir ?", r: "Quartz : non poreux, pas d'entretien. Granit : motif unique, mais necessite hydrofuge tous les 2 ans." },
      { q: "Resistant aux rayures ?", r: "Oui, durete 7 sur echelle Mohs (proche du saphir). Resistant aux taches et aux chocs thermiques." },
      { q: "Combien de temps de pose ?", r: "Une journee de pose, apres 4 a 6 semaines de fabrication sur mesure en atelier." },
    ],
    source: { label: "Federation francaise marbrerie (FFM)", url: "https://www.ffmatcb.fr/" },
  },

  // ============================================================
  // PARQUETEUR
  // ============================================================
  {
    slug: "pose-parquet-flottant",
    metier: "parqueteur",
    nom: "Pose parquet flottant",
    accroche: "Stratifie ou contrecolle clipse sur sous-couche : 25 a 60 euros au m2 pose et fourniture.",
    prix_min: 25,
    prix_max: 70,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Type : stratifie (HDF) ou contrecolle (chene)",
      "Epaisseur (6, 8, 10 mm)",
      "Sous-couche acoustique",
      "Decoupes complexes (chambranles, niches)",
    ],
    variantes: [
      { nom: "Stratifie 8 mm AC4", prix_min: 25, prix_max: 40 },
      { nom: "Contrecolle chene 10 mm", prix_min: 40, prix_max: 55 },
      { nom: "Contrecolle premium 14 mm + sous-couche phonique", prix_min: 55, prix_max: 70 },
    ],
    economies: [
      "Acheter le parquet en gros (Bricoman, Lapeyre, Castorama)",
      "Choisir AC4 minimum (resistance abrasion residentielle), AC5 cuisine",
      "Eviter motifs complexes (point de Hongrie, chevron : 2x plus cher)",
    ],
    faq: [
      { q: "Sur quel sol peut-on poser ?", r: "Sol plan + 3 mm/m. Sur carrelage : OK avec sous-couche. Sur ancien parquet : OK avec primaire." },
      { q: "Plinthes incluses ?", r: "Souvent en option, prevoir 8 a 15 euros au metre lineaire." },
      { q: "Combien de temps de pose ?", r: "1 jour pour 30 m2 (pose simple, sans decoupes complexes)." },
    ],
    source: { label: "UFFEP federation parqueteurs", url: "https://www.uffep.fr/" },
  },
  {
    slug: "pose-parquet-massif",
    metier: "parqueteur",
    nom: "Pose parquet massif",
    accroche: "Chene, bois exotique : 50 a 150 euros au m2, mais pour 50 a 100 ans de service.",
    prix_min: 50,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Essence : chene, bois exotique, frene",
      "Largeur des lames (60 mm, 110 mm, 180 mm)",
      "Mode de pose : colle ou cloue",
      "Finition : huile, vitrification, brut",
    ],
    variantes: [
      { nom: "Chene massif 110 mm clouee", prix_min: 50, prix_max: 90 },
      { nom: "Chene massif 180 mm colle", prix_min: 80, prix_max: 130 },
      { nom: "Bois exotique premium 180 mm point de Hongrie", prix_min: 130, prix_max: 180 },
    ],
    economies: [
      "Pose simple (lames droites) : 30 pourcents moins cher que motif",
      "Acheter en pepiniere/scierie locale (chene -20 pourcents vs grandes surfaces)",
      "Conserver la finition huile (entretien plus simple, retouches faciles)",
    ],
    faq: [
      { q: "Combien de temps de pose ?", r: "2 a 3 jours pour 30 m2 + 1 jour de finition (vitrification)." },
      { q: "Massif ou contrecolle ?", r: "Massif : poncable plusieurs fois, dure 100 ans. Contrecolle : 1 a 2 poncages, dure 30 a 50 ans." },
      { q: "Quelle epaisseur minimum ?", r: "20 mm pour rainure-languette, 23 mm pour cloue. En neuf : prevoir 22 mm minimum." },
    ],
    source: { label: "FFB metiers parqueteurs", url: "https://www.ffbatiment.fr/" },
  },
  {
    slug: "poncage-vitrification",
    metier: "parqueteur",
    nom: "Poncage et vitrification de parquet",
    accroche: "Renover un parquet ancien : ponce + vitrifier en 3 a 5 jours, 25 a 50 euros au m2.",
    prix_min: 25,
    prix_max: 60,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Etat initial du parquet",
      "Surface a renover",
      "Type de finition (vitrification, huile, vernis)",
      "Reparation lames endommagees",
    ],
    variantes: [
      { nom: "Poncage simple + vitrification 1 couche", prix_min: 25, prix_max: 35 },
      { nom: "Poncage + vitrification 3 couches polyurethane", prix_min: 35, prix_max: 50 },
      { nom: "Poncage + huilage premium (Rubio, Osmo)", prix_min: 45, prix_max: 60 },
    ],
    economies: [
      "Faire en periode creuse (octobre-mars) pour negocier",
      "Demander conseil sur le nombre de couches (3 standard, 4 pour passage intense)",
      "Eviter les couleurs fantaisistes (decapage difficile)",
    ],
    faq: [
      { q: "Combien de fois peut-on poncer un parquet ?", r: "Massif 22 mm : 4 a 6 fois. Contrecolle 4 mm couche d'usure : 1 a 2 fois max." },
      { q: "Vitrification ou huile ?", r: "Vitrification : surface lisse, durable 8 a 15 ans, retouche complete necessaire. Huile : retouche zone par zone." },
      { q: "Combien de temps avant utilisation ?", r: "24 h apres derniere couche pour pieton, 3 jours pour mobilier, 7 jours pour tapis." },
    ],
    source: { label: "UFFEP renovation parquets", url: "https://www.uffep.fr/" },
  },
  {
    slug: "pose-parquet-chevron",
    metier: "parqueteur",
    nom: "Pose parquet chevron ou point de Hongrie",
    accroche: "Motif d'architecte : 60 a 150 euros au m2, design intemporel.",
    prix_min: 60,
    prix_max: 180,
    unite: "m2",
    inclus: "tout-compris",
    facteurs: [
      "Type : chevron 45 degres ou point de Hongrie 60 degres",
      "Essence (chene majoritaire)",
      "Largeur des lamelles",
      "Motif central (cabochons, frises)",
    ],
    variantes: [
      { nom: "Chevron chene contrecolle", prix_min: 60, prix_max: 100 },
      { nom: "Point de Hongrie chene massif", prix_min: 100, prix_max: 140 },
      { nom: "Point de Hongrie large 110 mm + frise", prix_min: 140, prix_max: 180 },
    ],
    economies: [
      "Choisir chevron plutot que point de Hongrie (15 a 20 pourcents moins cher)",
      "Eviter le sur-mesure de longueur de lamelles (preferer formats standards)",
      "Limiter motif central a une seule piece (salon)",
    ],
    faq: [
      { q: "Chevron ou point de Hongrie : difference ?", r: "Chevron : lamelles a 45 degres, decalees. Point de Hongrie : a 60 degres, alignees a chaque pointe." },
      { q: "Combien de temps de pose ?", r: "3 a 5 jours pour 30 m2 (motif complexe)." },
      { q: "Sur sol plein possible ?", r: "Oui, a coller sur chape parfaitement plane (defaut maxi 2 mm/m)." },
    ],
    source: { label: "Federation francaise menuiserie parquets", url: "https://www.ffbatiment.fr/" },
  },
];

export const PRESTATIONS_PAR_METIER: Record<string, Tarif[]> = TARIFS.reduce(
  (acc, t) => {
    (acc[t.metier] ||= []).push(t);
    return acc;
  },
  {} as Record<string, Tarif[]>,
);

export function formatPrix(prix: number): string {
  if (prix >= 1000) {
    return new Intl.NumberFormat("fr-FR").format(prix) + " euros";
  }
  return prix + " euros";
}

export function rangeFR(min: number, max: number, unite: Tarif["unite"]): string {
  const minStr = formatPrix(min);
  const maxStr = formatPrix(max);
  const uniteLabels: Record<Tarif["unite"], string> = {
    intervention: "par intervention",
    m2: "/ m2",
    ml: "/ ml",
    u: "/ unite",
    h: "/ heure",
    annee: "/ an",
    arbre: "/ arbre",
  };
  return `${minStr} a ${maxStr} ${uniteLabels[unite]}`;
}
