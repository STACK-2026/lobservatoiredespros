/**
 * Guides editoriaux "Comment choisir son [metier]" , 15 metiers BTP
 * 1 article par metier : criteres / drapeaux rouges / questions devis / FAQ.
 * Source : reglementation FR 2026, NF DTU, ADEME, France Renov', DGCCRF, Capeb.
 *
 * Aucune mention generique. Chaque entree est specifique au metier.
 */

export interface CritereSelection {
  titre: string;
  description: string;
  /** importance : critique / elevee / utile */
  niveau: "critique" | "elevee" | "utile";
}

export interface QuestionDevis {
  q: string;
  r: string;
}

export interface FaqEntry {
  q: string;
  r: string;
}

export interface GuideMetier {
  metier: string;
  titre: string;
  meta_description: string;
  intro: string;
  /** Pourquoi le choix est strategique (3-4 phrases) */
  enjeu: string;
  criteres: CritereSelection[];
  drapeaux_rouges: string[];
  questions_devis: QuestionDevis[];
  /** Cas concret editorial , 80-120 mots */
  cas_concret: { titre: string; texte: string };
  faq: FaqEntry[];
  /** Ressources externes a citer (autorite SEO/GEO) */
  sources: { label: string; url: string }[];
}

export const GUIDES_METIERS: GuideMetier[] = [
  // ============================================================
  // PLOMBIER
  // ============================================================
  {
    metier: "plombier",
    titre: "Comment choisir un bon plombier",
    meta_description: "Criteres, drapeaux rouges et 5 questions a poser pour choisir un plombier fiable. RGE, decennale, devis honnete : la grille complete 2026.",
    intro: "Un plombier, on l'appelle quand l'eau coule au plafond ou que la chaudiere lache un dimanche soir. Mauvais moment pour comparer cinq devis. Le bon reflexe : faire ses devoirs avant l'urgence , verifier les attestations, comprendre les fourchettes de prix, repérer les arnaques classiques. Voici la methode editoriale de notre redaction, celle que vous appliquerez a tous les artisans BTP.",
    enjeu: "La plomberie touche a l'eau (degats des eaux), au gaz (securite vitale) et au chauffage (confort + facture). Une mauvaise pose se paie en degats des eaux, en regrets esthetiques ou en perte d'aides MaPrimeRenov'. Le marche francais comprend 80 000 entreprises, dont moins de 15 000 sont certifiees RGE , la difference qui ouvre les aides publiques.",
    criteres: [
      {
        titre: "Certification RGE QualiPAC ou QualiSol",
        description: "Pour beneficier de MaPrimeRenov' et CEE sur un chauffe-eau thermodynamique, une PAC ou un solaire thermique, l'artisan doit etre RGE specialise. Verifiable en direct sur france-renov.gouv.fr/registre.",
        niveau: "critique",
      },
      {
        titre: "Assurance decennale plomberie active",
        description: "Obligatoire (loi Spinetta 1978). Demandez l'attestation nominative datee de moins de 12 mois. Verifiez la mention 'plomberie sanitaire et chauffage' dans les activites couvertes.",
        niveau: "critique",
      },
      {
        titre: "Habilitation gaz PG ou PGN",
        description: "Si vous installez ou renovez une chaudiere gaz, le plombier doit avoir un certificat Professionnel Gaz (PG) ou Professionnel Gaz Naturel (PGN). Sans ca : aucune mise en service legale possible.",
        niveau: "critique",
      },
      {
        titre: "Specialite affichee : depannage, sanitaire ou chauffage",
        description: "Un depanneur urgences a un cout horaire eleve mais peu d'expertise renovation. Un specialiste chauffage maitrise les bilans thermiques. Un specialiste sanitaire concoit les salles de bain. Choisissez selon votre projet.",
        niveau: "elevee",
      },
      {
        titre: "Anciennete au registre Sirene",
        description: "Une entreprise active depuis plus de 5 ans a survecu aux moments creux et a forme ses ouvriers. Verifiez sur sirene.gouv.fr ou via notre outil /outils/verifier-siret/.",
        niveau: "elevee",
      },
      {
        titre: "Photos de realisations et avis clients verifies",
        description: "Au-dela de Google, demandez 2 ou 3 references chantiers de moins de 12 mois. Un plombier serieux a toujours quelques clients pretes a temoigner.",
        niveau: "utile",
      },
    ],
    drapeaux_rouges: [
      "Demarchage telephonique pour 'mise aux normes obligatoire' ou 'controle gratuit' , 90 % des cas sont des arnaques.",
      "Devis verbal pour une intervention de plus de 150 euros TTC , la loi (article L.111-1 Code conso) impose un devis ecrit.",
      "Acompte demande superieur a 30 pourcents avant debut des travaux , illegal pour les artisans BTP.",
      "Refus de fournir l'attestation decennale ou prix d'un cumulus suspect pour un chauffe-eau thermodynamique RGE-aide (souvent : faux RGE).",
      "Tarifs nuit/dimanche/ferie sans majoration claire affichee, ou frais de deplacement non chiffres au telephone.",
      "TVA 5,5 pourcents proposee sans certification RGE active , le taux applicable sera 20 pourcents et le devis est faux.",
    ],
    questions_devis: [
      {
        q: "Quelle est la marque exacte du chauffe-eau ou de la chaudiere proposee, et son COP/ETAS ?",
        r: "Un plombier serieux ecrit la marque, le modele, et le COP (pour PAC) ou ETAS (rendement saisonnier). Refusez 'chauffe-eau electrique 200L generique' sans reference.",
      },
      {
        q: "Quelle est la garantie sur la pose et sur les pieces ?",
        r: "Decennale obligatoire sur l'installation (10 ans). Garantie constructeur sur les pieces (2 a 10 ans selon equipement). Demandez les deux par ecrit.",
      },
      {
        q: "Qui prend en charge l'evacuation des dechets de chantier ?",
        r: "Souvent oublie au devis. Selon le DTU et la loi de 2018, c'est l'artisan. S'il facture en plus, c'est negociable ou refusable.",
      },
      {
        q: "Quel est le delai d'intervention apres la commande, et quelles penalites en cas de retard ?",
        r: "Un delai s'engage par ecrit. Penalites de retard : standard 1/3000 par jour de retard sur le total. Si le plombier refuse, signal d'alerte.",
      },
      {
        q: "Avez-vous deja installe ce modele exact ? Pouvez-vous me donner 2 references locales ?",
        r: "Une question simple qui filtre les amateurs. Un specialiste a forcement deja pose 10+ chauffe-eau de la marque qu'il propose.",
      },
    ],
    cas_concret: {
      titre: "Anatomie d'un devis honnete : pose chauffe-eau thermodynamique 250L",
      texte: "Sur le devis publie sur notre fiche pro Auxerre 89000, on lit : marque Atlantic Calypso 250L thermodynamique sur air ambiant, COP 3,15 a 7 degC. Pose : 850 euros HT (depose ancien cumulus + pose neuf + raccordements + mise en service). Fourniture : 2 200 euros HT (negociee 5 pourcents en dessous tarif fabricant). Sortie ventouse : 220 euros. Total : 3 270 euros HT, soit 3 597 euros TTC (TVA 10 pourcents renovation logement plus de 2 ans). MaPrimeRenov' menages modestes : 1 200 euros. CEE : 200 euros. Reste a charge : 2 197 euros. Devis ecrit sur 4 pages, signe, avec attestation RGE QualiPAC valide jusqu'au 12 mars 2027.",
    },
    faq: [
      {
        q: "Mon plombier doit-il etre RGE pour les aides MaPrimeRenov' ?",
        r: "Oui obligatoire pour PAC, chauffe-eau thermodynamique, solaire. Pour un cumulus electrique standard : non, mais pas d'aide non plus. Verifiez la qualification specifique (QualiPAC, QualiSol, PG, etc.) sur france-renov.gouv.fr.",
      },
      {
        q: "Combien coute une intervention en urgence (nuit, dimanche, ferie) ?",
        r: "Majoration legale jusqu'a 100 pourcents du tarif jour ouvre. Une fuite d'eau simple : 200 a 600 euros la nuit. Au-dela, exigez devis ecrit avant intervention (obligation legale plus de 100 euros TTC).",
      },
      {
        q: "Que faire si mon plombier laisse des malfaçons ?",
        r: "1) Mise en demeure par lettre recommandee avec photos. 2) Conciliation via la Federation Nationale BTP locale. 3) Saisie de la garantie decennale via votre assurance. La decennale couvre 10 ans toute fuite, fissure ou vice technique.",
      },
      {
        q: "Plombier ou multitravaux : quelle difference ?",
        r: "Un multitravaux ('homme a tout faire') n'a souvent pas la decennale plomberie ni les habilitations gaz. Pour un robinet ou une fuite mineure : peut suffire. Pour une chaudiere, salle de bain complete, gaz : plombier qualifie obligatoire.",
      },
      {
        q: "Combien de devis demander avant de signer ?",
        r: "Trois devis comparables est la regle d'or. Ecart superieur a 30 pourcents entre eux : creusez. Soit le plus cher gonfle, soit le moins cher coupe les coins. Le devis median est souvent le plus fiable.",
      },
    ],
    sources: [
      { label: "France Renov' aides plomberie", url: "https://france-renov.gouv.fr/aides/eligibilite/chauffe-eau" },
      { label: "DGCCRF , obligations devis artisan", url: "https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Le-devis" },
      { label: "Capeb , reglementation plomberie", url: "https://www.capeb.fr/" },
    ],
  },
  // ============================================================
  // ELECTRICIEN
  // ============================================================
  {
    metier: "electricien",
    titre: "Comment choisir un bon electricien",
    meta_description: "Habilitation, NF C 15-100, Consuel : les criteres pour choisir un electricien fiable. Drapeaux rouges et questions a poser. Guide editorial 2026.",
    intro: "L'electricite est silencieuse jusqu'a la panne, l'incendie ou le choc electrique. Un mauvais electricien peut faire passer une installation pour conforme alors qu'elle ne l'est pas , et la sanction tombe le jour du sinistre, quand l'assurance refuse sa garantie. Voici comment choisir, etape par etape.",
    enjeu: "30 pourcents des incendies domestiques en France sont d'origine electrique (source ONSE 2024). La norme NF C 15-100, mise a jour amendement A5 en 2021, s'impose a toute installation neuve ou refaite. Le Consuel atteste la conformite. Sans Consuel, votre assurance peut tout simplement ne pas couvrir un sinistre.",
    criteres: [
      {
        titre: "Habilitation electrique en cours de validite",
        description: "B1V, B2V, BR, BC selon les niveaux. L'electricien doit afficher une carte d'habilitation a jour (recyclage tous les 3 ans). Sans ca, il n'a meme pas le droit de retirer un disjoncteur.",
        niveau: "critique",
      },
      {
        titre: "Decennale specialite courant fort + faible",
        description: "Verifiez que la mention 'electricite' figure dans le contrat decennal. Certains contrats excluent la domotique ou les courants faibles , a verifier si vous installez une alarme ou de la fibre.",
        niveau: "critique",
      },
      {
        titre: "NF C 15-100 amendement A5 maitrise",
        description: "L'amendement A5 (2021) impose disjoncteurs differentiels 30 mA partout, parafoudre obligatoire en zone AQ2, points lumineux DCL conformes. Posez cette question , reponse vague = electricien depasse.",
        niveau: "critique",
      },
      {
        titre: "Certification IRVE (Categorie 1, 2 ou 3)",
        description: "Pour installer une borne de recharge vehicule electrique au-dela de 3,7 kW. Sans IRVE : pas de credit d'impot 75 pourcents (plafond 500 euros). Verifiable sur la liste advenir.mobi.",
        niveau: "elevee",
      },
      {
        titre: "Consuel apres travaux significatifs",
        description: "Pour tout remplacement de tableau electrique ou nouveau circuit principal, le Consuel atteste la conformite. Un electricien serieux integre la demande Consuel dans son forfait. S'il ne le fait pas : signal.",
        niveau: "elevee",
      },
      {
        titre: "Photos de tableaux precedents et reseaux propres",
        description: "Un tableau electrique bien fait, c'est de l'art. Les fils alignes, etiquetes, peignes propres. Demandez des photos. Un tableau spaghetti = mauvais electricien.",
        niveau: "utile",
      },
    ],
    drapeaux_rouges: [
      "Aucune mention de la NF C 15-100 ou refus d'expliquer ce que c'est.",
      "Pose d'une borne de recharge VE sans certificat IRVE , vous perdrez 500 euros de credit d'impot et la garantie constructeur.",
      "Devis sans 'Consuel obligatoire apres travaux' alors que vous changez le tableau ou ajoutez un circuit principal.",
      "Branchement sans differentiel 30 mA en tete de groupe , non conforme depuis 2003.",
      "Prises sans terre (2 broches) gardees sur un circuit refait , obligation a la reprise.",
      "Vente forcee 'mise aux normes obligatoire' a domicile sans demande prealable , souvent une arnaque.",
    ],
    questions_devis: [
      {
        q: "Mon installation respecte-t-elle l'amendement A5 de la NF C 15-100 ?",
        r: "L'electricien serieux saura citer : disjoncteur differentiel 30 mA par groupe, parafoudre si AQ2, points lumineux DCL, prises 16A min. par piece. Si flou : il ne suit pas la norme.",
      },
      {
        q: "Le Consuel est-il integre au devis ou en supplement ?",
        r: "Un electricien qui ne propose pas le Consuel sur travaux significatifs vous expose. Cout standard : 130 a 200 euros. Doit etre dans le devis.",
      },
      {
        q: "Quelle est l'origine et la marque exacte de mon tableau et de mes appareillages ?",
        r: "Refusez 'tableau standard'. Exigez : marque Schneider Electric (Resi 9, Acti 9), Legrand (Drivia, Mosaic), Hager (Volta). Marques generiques chinoises = qualite inferieure et SAV inexistant.",
      },
      {
        q: "Mon installation est-elle compatible avec une future borne de recharge VE ?",
        r: "Si vous prevoyez une voiture electrique dans 5 ans, l'electricien peut anticiper le passage en triphase 18 ou 36 kVA. Couts marginaux maintenant, evite des travaux 2x plus chers ensuite.",
      },
      {
        q: "Avez-vous fait un test isolement avant de me remettre l'installation ?",
        r: "Un test megger (mesure de la resistance d'isolement) doit etre fait. Resultat consigne sur le PV de reception. Sans ca : votre assurance peut refuser sa garantie en cas de court-circuit.",
      },
    ],
    cas_concret: {
      titre: "Anatomie d'un tableau electrique aux normes : appartement 70 m2",
      texte: "Sur la fiche pro Paris 75011, le tableau livre comprend : 1 disjoncteur d'abonne 60A monophase, 4 interrupteurs differentiels 30 mA type AC pour circuits prises et eclairage, 2 type A pour lave-linge et plaque cuisson (obligatoires sur ces appareils), 1 type B (Hi-FI ou IRVE), 12 disjoncteurs divisionnaires (eclairage, prises piece, four, plaques, lave-linge, lave-vaisselle, secheur, chauffage, IRVE), 1 parafoudre type 2 (zone AQ1 mais recommande en agglomeration). PV Consuel obtenu en 8 jours. Devis : 2 350 euros HT pose + 480 euros materiel = 2 830 euros HT.",
    },
    faq: [
      {
        q: "Quand le Consuel est-il obligatoire ?",
        r: "Pour tout remplacement complet d'un tableau electrique, ajout de nouveau circuit principal, ou installation neuve. Sans Consuel valide : Enedis ne raccorde pas le compteur. Cout 130 a 200 euros, dans le devis.",
      },
      {
        q: "Qu'est-ce que la norme NF C 15-100 ?",
        r: "Norme francaise des installations electriques basse tension. Amendement A5 (2021) en vigueur. Principaux points : disjoncteurs differentiels 30 mA, parafoudre AQ2, points lumineux DCL, hauteur prises, sections cables. Tout electricien doit la connaitre par coeur.",
      },
      {
        q: "Mise aux normes complete : combien ca coute ?",
        r: "700 a 1 500 euros pour un tableau seul (T2 standard). 1 500 a 3 000 euros pour un tableau plus refonte de cablage. 2 500 a 5 000 euros pour une refonte totale (cables, prises, points lumineux). Voir notre /tarifs/electricien/.",
      },
      {
        q: "Mon ancien proprio n'a pas refait l'electricite : qui paie ?",
        r: "Achat dans l'ancien : c'est a l'acheteur. Le diagnostic plomb-amiante-electricite des plus de 15 ans est fourni au compromis , il signale les defauts mais n'oblige pas. Vendre : pas d'obligation sauf bail location longue duree.",
      },
      {
        q: "Combien de prises par piece selon la norme ?",
        r: "Cuisine : minimum 6 prises 16A, dont 4 sur le plan de travail. Salle de bain : 1 a 3 selon hors volume, GFCI. Chambre : 3 minimum. Sejour : 5 minimum. Bureau : 5 minimum. Tout disjoncteur 30 mA en tete.",
      },
    ],
    sources: [
      { label: "Promotelec , NF C 15-100 guide", url: "https://www.promotelec.com/" },
      { label: "Consuel , attestation conformite", url: "https://www.consuel.com/" },
      { label: "Programme Advenir , IRVE", url: "https://advenir.mobi/" },
    ],
  },
  // ============================================================
  // COUVREUR
  // ============================================================
  {
    metier: "couvreur",
    titre: "Comment choisir un bon couvreur",
    meta_description: "Decennale, Qualibat, securite chantier : criteres pour choisir un couvreur fiable. Drapeaux rouges du demarchage post-tempete et 5 questions a poser.",
    intro: "Une toiture, ca dure 50 a 100 ans si c'est bien fait. Et 5 a 10 ans si c'est mal fait. La difference se fait au choix du couvreur. Plus que pour aucun autre metier, ce choix engage votre patrimoine sur 2 generations. Voici comment ne pas se tromper.",
    enjeu: "La toiture represente 30 pourcents des deperditions thermiques d'une maison non isolee. Une refection complete coute 8 000 a 25 000 euros. Avec ITE par dessus (sarking), on monte a 35 000+. C'est l'un des plus gros chantiers d'une vie de proprietaire. Et le terrain de jeu prefere des arnaqueurs apres tempete.",
    criteres: [
      {
        titre: "Decennale specialisee couverture-zinguerie",
        description: "Toutes les decennales ne couvrent pas la couverture. Demandez l'attestation precise. Un couvreur sans decennale couverture est juste interdit d'exercer.",
        niveau: "critique",
      },
      {
        titre: "Qualibat 3 chiffres pour couverture",
        description: "Code Qualibat 3122 (couverture metallique), 3132 (charpente bois), 3142 (zinc). Chaque code = competence verifiee. Verifiable sur qualibat.com.",
        niveau: "critique",
      },
      {
        titre: "RGE QualiBat ou Qualisol (si isolation)",
        description: "Pour ITE par dessus toiture (sarking) ou isolation combles, le couvreur doit etre RGE. Sans ca : pas de MaPrimeRenov'.",
        niveau: "critique",
      },
      {
        titre: "Securite chantier : EPI, harnais, echafaudage",
        description: "Un couvreur qui grimpe sans harnais et sans echafaudage est en danger , et vous etes responsable civilement s'il chute. Exigez un plan de prevention ecrit pour tout chantier de plus de 1 jour.",
        niveau: "critique",
      },
      {
        titre: "Specialite materiau : tuile vs ardoise vs zinc",
        description: "La pose d'ardoise demande un savoir-faire que peu maitrisent. Le zinc joint debout est encore plus rare. Verifiez les references chantiers du couvreur sur le materiau exact prevu.",
        niveau: "elevee",
      },
      {
        titre: "Photos de chantiers anciens (5+ ans)",
        description: "Demandez des photos de toitures faites il y a 5 a 10 ans. Si elles sont encore impeccables : couvreur de qualite. Si elles ont des taches ou des mousses precoces : pose limite.",
        niveau: "utile",
      },
    ],
    drapeaux_rouges: [
      "Demarchage a domicile ou par telephone post-tempete (mediatisee) pour 'verification gratuite de toiture' , pratique abusive.",
      "Devis qui ne mentionne pas l'ecran sous-toiture HPV (haute permeabilite a la vapeur) , obligation depuis 2018 sur toute refection.",
      "Pas de mention 'reprise charpente eventuelle' , si la charpente est pourrie, le devis va doubler.",
      "Absence du nom precis du fournisseur de tuiles ou ardoises , les marques bas de gamme ne durent pas.",
      "Pas d'echafaudage prevu pour 50 m2 de toiture (au-dela de 3m de hauteur, obligatoire).",
      "Acompte 50 pourcents ou plus a la signature , illegal pour artisan BTP (max 30 pourcents).",
    ],
    questions_devis: [
      {
        q: "Quelle est la marque exacte des tuiles ou ardoises proposees, et leur garantie fabricant ?",
        r: "Tuiles terre cuite Imerys, Edilians, Monier : 100 ans garantie gel. Ardoise naturelle Espagne ou Angers : 75-100 ans. Refusez 'tuiles standard' sans reference, souvent du low cost qui se gele en 10 ans.",
      },
      {
        q: "Quel ecran sous-toiture HPV est pose, et a quelle pente ?",
        r: "Tout couvreur serieux pose un ecran HPV (haute permeabilite a la vapeur, exemple : Delta-Vent S, Tyvek Supro). Marque + reference + grammage > 100 g/m2 doivent etre au devis.",
      },
      {
        q: "La charpente sera-t-elle inspectee, et si pourrie, comment est-elle reprise ?",
        r: "Inspection obligatoire avant pose. Si chevrons pourris : reprise au cas par cas. Couvreur serieux integre une provision (10 a 20 pourcents) au devis pour reprises potentielles.",
      },
      {
        q: "Combien de temps de chantier, et qui s'occupe du nettoyage et de l'evacuation des dechets ?",
        r: "100 m2 de toiture : 10 a 15 jours ouvres + nettoyage. L'evacuation des dechets (ancienne couverture) est a la charge du couvreur. Cout integre. Refusez s'il facture en plus.",
      },
      {
        q: "Avez-vous deja fait des chantiers identiques (meme materiau, meme pente) il y a plus de 10 ans ?",
        r: "Une vraie reference : 'oui, j'ai pose 80 m2 de tuiles Edilians chez M. Dupont en 2014, vous pouvez l'appeler'. Pas une reference : 'oui souvent'.",
      },
    ],
    cas_concret: {
      titre: "Anatomie d'un chantier reussi : refection toiture 120 m2 tuile + ITE",
      texte: "Sur la fiche pro Auxerre 89000, le couvreur livre : depose 120 m2 de tuiles canal mediterraneenes anciennes (1985), reprise de 8 chevrons pourris (provision atteinte), pose d'un ecran HPV Delta-Vent S, isolation par sarking (panneaux laine de bois 200 mm R = 5,3), pose tuiles canal Edilians neuves grain naturel. Echafaudage type S pour 14 jours. Total : 22 800 euros HT, soit 25 080 euros TTC (TVA 5,5 RGE). MaPrimeRenov' menages modestes : 7 200 euros. CEE Coup de Pouce : 1 800 euros. Reste a charge : 16 080 euros. ROI energie : 380 euros par an, ROI 30 ans (mais surtout patrimoine valorise plus de 30 000 euros au DPE).",
    },
    faq: [
      {
        q: "Quand faut-il refaire sa toiture ?",
        r: "Tuiles terre cuite : 50 a 100 ans selon climat. Ardoise : 80 a 100 ans. Zinc : 60 a 80 ans. Tole bac acier : 30 a 50 ans. Surveiller : taches d'humidite plafond, tuiles cassees, mousses persistantes apres demoussage. Diagnostic gratuit chez la plupart des couvreurs.",
      },
      {
        q: "Refection toiture : faut-il une declaration en mairie ?",
        r: "Declaration prealable de travaux obligatoire si changement de materiau, couleur ou aspect. Permis de construire si changement de pente. Mairie de moins de 2 mois pour repondre. Demarches integrees au devis chez les couvreurs serieux.",
      },
      {
        q: "Faut-il faire une isolation par exterieur (sarking) en meme temps ?",
        r: "Si la toiture est a refaire et l'isolation manquante ou ancienne : oui, ROI excellent. Sarking ajoute 100-150 euros/m2 mais beneficie de MaPrimeRenov' jusqu'a 75 euros/m2. Mutualiser le chantier divise les couts d'echafaudage par 2.",
      },
      {
        q: "Mon assurance couvre-t-elle les degats apres tempete ?",
        r: "Oui si arrete catastrophes naturelles + declaration sous 5 jours. Tuiles arrachees, branches tombees, fuite : indemnises. PAS la vetuste ni les defauts d'entretien. Photos avant/apres essentielles.",
      },
      {
        q: "Demoussage de toiture : utile ou arnaque ?",
        r: "Utile tous les 5 a 7 ans en zone humide. Arnaque si vendu apres demarchage telephonique a 50 euros/m2 (5x trop cher). Tarif honnete : 8 a 25 euros/m2 selon hydrofuge applique.",
      },
    ],
    sources: [
      { label: "FFB couvreurs federation", url: "https://www.ffbatiment.fr/" },
      { label: "Qualibat , couverture certifications", url: "https://www.qualibat.com/" },
      { label: "ADEME guide isolation toiture", url: "https://librairie.ademe.fr/urbanisme-et-batiment/" },
    ],
  },
  // ============================================================
  // MENUISIER
  // ============================================================
  {
    metier: "menuisier",
    titre: "Comment choisir un bon menuisier",
    meta_description: "Atelier ou pose seule, decennale, RGE pour fenetres : criteres pour choisir un menuisier fiable. Questions devis et FAQ. Guide editorial 2026.",
    intro: "Un menuisier, c'est plusieurs metiers : poseur de fenetres (renovation thermique), agenceur (cuisines/dressings), charpentier (combles), ebeniste (mobilier). Chaque specialite a ses criteres. Voici comment choisir selon votre projet.",
    enjeu: "Les menuiseries exterieures (fenetres, portes) representent 10 a 15 pourcents des pertes thermiques. Une fenetre mal posee laisse passer l'air. Une porte d'entree pas ajustee perd 200 euros par an. Et c'est ce metier qui a le plus de variation prix/qualite : du PVC chinois bas de gamme au chene massif sur-mesure.",
    criteres: [
      {
        titre: "Atelier ou pose seule ? Diagnostiquer le profil",
        description: "Un menuisier avec atelier propre fabrique sur-mesure, avec equipement (raboteuse, scie a panneaux). Un menuisier 'poseur' achete des produits standard. Demandez a visiter l'atelier , revelateur.",
        niveau: "elevee",
      },
      {
        titre: "RGE sur fenetres pour MaPrimeRenov'",
        description: "Pour beneficier des aides sur changement de fenetres, le menuisier doit etre RGE QualiBat (qualifications 3741, 3742, 3743). Plafond MaPrimeRenov' : 100 euros par fenetre selon revenus.",
        niveau: "critique",
      },
      {
        titre: "Decennale couvrant menuiserie + charpente eventuelle",
        description: "La menuiserie exterieure est couverte par la decennale standard. Mais si vous touchez a la charpente (escalier, comble), la decennale specifique 'travaux de charpente' est obligatoire.",
        niveau: "critique",
      },
      {
        titre: "Echantillons et photos de realisations chez clients",
        description: "Un menuisier serieux a toujours des echantillons en bois (chene, hetre, frene, exotique) pour vous toucher la matiere. Refusez les choix sur catalogue uniquement.",
        niveau: "elevee",
      },
      {
        titre: "Coefficient Uw des fenetres clairement specifie",
        description: "Uw mesure la deperdition thermique (W/m2.K). MaPrimeRenov' impose Uw <= 1,3 pour double vitrage et 1,1 pour triple vitrage. Un menuisier serieux affiche le coefficient au devis.",
        niveau: "critique",
      },
      {
        titre: "Garantie sur quincaillerie et vitrage",
        description: "10 ans decennale + 5 ans constructeur sur etancheite vitrage isolant + 2 ans sur quincaillerie. Demandez les 3 par ecrit.",
        niveau: "utile",
      },
    ],
    drapeaux_rouges: [
      "Menuisier propose 'pose en renovation' alors que les dormants sont pourris , obligation de depose totale.",
      "Pas de mention du fabricant des fenetres et de leur certification CSTBat , souvent du low cost imports.",
      "Devis sans mention du coefficient Uw (deperdition thermique) , vous ne pouvez pas verifier l'eligibilite aux aides.",
      "Pose 'au coup de pige' sans pose de joints periphericiel etanches a l'air , mauvais resultat thermique.",
      "Promesse 'cuisine sur-mesure' a moins de 7 000 euros , c'est forcement un assemblage de pieces standard.",
      "Refus de visite atelier ou prive jamais montree , forcement sous-traitant offshore.",
    ],
    questions_devis: [
      {
        q: "Quel est le fabricant et la reference exacte des fenetres ? Et leur Uw ?",
        r: "Refusez 'fenetres PVC double vitrage standard'. Exigez : marque (Veka, Aluplast, K-Line, Internorm), profil (4-16-4, 4-12-4-12-4 triple), gaz argon ou krypton, Uw (1,3 max pour MaPrimeRenov'). Si flou : low cost.",
      },
      {
        q: "Pose en renovation ou depose totale ?",
        r: "Renovation = sur dormant existant, plus rapide, moins cher. Depose totale = nouveau dormant, meilleure etancheite. Renovation OK si dormant sain. Si pourri : depose obligatoire (ne pas economiser ici).",
      },
      {
        q: "Comment etes-vous certifie en pose de fenetres ?",
        r: "Demandez la qualification Qualibat menuiserie exterieure (3741) ou la certification fabricant (label Pose Veka, Aluplast Pose+, etc.). Sans cert : risque de pose non conforme et perte de garantie.",
      },
      {
        q: "Sur cuisine sur-mesure : pouvez-vous me montrer une realisation client recente que je peux visiter ?",
        r: "Un cuisiniste serieux a 2-3 cuisines actuelles a montrer. Si refus 'confidentiel' ou 'pas dispo' : signal alarme. Un installateur fier de son travail montre.",
      },
      {
        q: "Quels sont vos delais de fabrication et de pose, et garanties en cas de retard ?",
        r: "Sur-mesure : 6 a 12 semaines fabrication apres signature. Pose : 1 a 3 jours par chantier. Penalites de retard : 1/3000 par jour ouvre du total. Si non specifie ou refuse : signal.",
      },
    ],
    cas_concret: {
      titre: "Anatomie d'une rénovation 8 fenetres + porte d'entree",
      texte: "Sur la fiche pro Sens 89100, le menuisier livre : 8 fenetres K-Line aluminium thermolaque gris anthracite, profil 75 mm, double vitrage 4-16-4 argon, Uw 1,28 (eligible MaPrimeRenov'). Pose en depose totale (dormants pourris). 1 porte d'entree alu inox panel paire de portes A2P BP1. Total : 14 800 euros HT (10 200 fenetres + 4 600 porte). TVA 5,5 (RGE QualiBat 3741, 3742). MaPrimeRenov' : 1 200 euros (8 x 150 menages modestes). CEE Coup de Pouce : 800 euros. Reste a charge : 12 800 euros. Garantie : 10 ans decennale, 5 ans vitrage isolant, 2 ans quincaillerie.",
    },
    faq: [
      {
        q: "PVC, aluminium, bois : comment choisir ?",
        r: "PVC : moins cher, isole bien, entretien zero. Alu : plus cher, plus design, montants plus fins, faiblesse thermique sauf rupture pont thermique. Bois : noble mais entretien tous les 5-10 ans (lasure). Mixte alu/bois : haut de gamme, durabilite + thermique.",
      },
      {
        q: "Faut-il declarer en mairie le changement de fenetres ?",
        r: "Si modification d'aspect (couleur, dimensions, materiau) : declaration prealable obligatoire. Si meme aspect : non. Verifiez le PLU local. Copropriete : reglement souvent restrictif.",
      },
      {
        q: "Combien coute une cuisine equipee sur mesure ?",
        r: "Cuisine 4 m IKEA-type : 3 500 a 6 000 euros. Cuisine 4 m Schmidt/Cuisinella moyen de gamme : 6 000 a 12 000 euros. Cuisine 5 m premium Mobalpa/Bulthaup : 14 000 a 30 000 euros. Voir nos /tarifs/cuisiniste/.",
      },
      {
        q: "Triple vitrage : utile en France ?",
        r: "Utile en zone froide H1 (alpes, montagne, nord-est) ou pour reduire le bruit. En zone H3 (sud) ou en plat-pieds : double vitrage 4-16-4 argon suffit. Le triple est 30 pourcents plus cher pour 10 pourcents de gain thermique en climat tempere.",
      },
      {
        q: "Mon ancien proprietaire avait pose des fenetres de mauvaise qualite : qui finance le remplacement ?",
        r: "C'est a la charge de l'acheteur (vente). Mais MaPrimeRenov' est cumulable avec eco-PTZ jusqu'a 30 000 euros. Soit pres de 50 pourcents du cout total finance par les aides pour les menages modestes.",
      },
    ],
    sources: [
      { label: "France Renov' fenetres", url: "https://france-renov.gouv.fr/aides/eligibilite/fenetre" },
      { label: "Qualibat menuiserie", url: "https://www.qualibat.com/" },
      { label: "FFB menuisiers", url: "https://www.ffbatiment.fr/" },
    ],
  },
  // ============================================================
  // ISOLATION
  // ============================================================
  {
    metier: "isolation",
    titre: "Comment choisir une bonne entreprise d'isolation",
    meta_description: "RGE obligatoire, ACERMI, NF DTU : criteres pour choisir un poseur d'isolation. Drapeaux rouges du 1 euro et 5 questions a poser.",
    intro: "L'isolation est le geste de renovation le plus rentable. Et le plus arnaque. La promesse 'isolation a 1 euro' a ete supprimee en 2020 mais ses heritiers (1 euro symbolique, 100 euros, etc.) prosperent encore. Voici comment choisir un vrai professionnel pour un chantier qui dure 30 ans.",
    enjeu: "L'isolation des combles perdus rentabilise en 5 a 7 ans grace aux economies de chauffage. Une mauvaise pose : 30 pourcents d'efficacite perdue + risques humidite. Le marche francais est inonde d'arnaqueurs depuis MaPrimeRenov' , les sanctions DGCCRF se multiplient mais la vigilance reste imperative.",
    criteres: [
      {
        titre: "Certification RGE QualiBat ou Qualifelec OBLIGATOIRE",
        description: "Sans RGE, aucune aide MaPrimeRenov' ni CEE possible. Verifiable en direct sur france-renov.gouv.fr/registre. Si l'artisan refuse de communiquer son numero : c'est un faux.",
        niveau: "critique",
      },
      {
        titre: "ACERMI sur isolant utilise",
        description: "L'isolant doit avoir un certificat ACERMI (Association pour la Certification des Materiaux Isolants). Specifie le R thermique, la conductivite thermique lambda, et la durabilite. Numero ACERMI au devis.",
        niveau: "critique",
      },
      {
        titre: "NF DTU 24.1 ventilation respecte",
        description: "Une isolation efficace exige une ventilation conforme. Sans VMC ou ventilation naturelle adequate : condensation, moisissures, isolant detruit en 5 ans. Le devis doit mentionner la ventilation.",
        niveau: "critique",
      },
      {
        titre: "Pare-vapeur correctement pose cote chaud",
        description: "Le pare-vapeur empeche la vapeur d'eau de penetrer dans l'isolant. Sans pare-vapeur ou mal pose : isolant trempe en 2 hivers. La pose se fait cote chaud (cote interieur).",
        niveau: "critique",
      },
      {
        titre: "Resistance thermique R cible (minimum 7 pour combles)",
        description: "MaPrimeRenov' impose R >= 7 m2.K/W pour combles perdus. R >= 6 pour rampants. Verifiez l'epaisseur minimum 200 mm laine soufflee ou 220 mm laine de bois.",
        niveau: "elevee",
      },
      {
        titre: "Photos pre/post chantier avec piges graduees",
        description: "Un isolier serieux place des piges graduees tous les 5 m2 pour controle visuel de l'epaisseur posee. Photos avant/apres systematiques. Demandez les voir avant signature.",
        niveau: "utile",
      },
    ],
    drapeaux_rouges: [
      "'Isolation a 1 euro' ou prix derisoire avec MaPrimeRenov' surdimensionne , souvent fraude aux aides.",
      "Demarchage telephonique pour 'isolation gratuite' ou 'controle thermique offert' , 95 pourcents d'arnaques.",
      "Pas de mention de pare-vapeur ou ventilation , isolation condamnee a court terme.",
      "Pose de polyurethane projete par un artisan non certifie ACERMI projection , risques sanitaires.",
      "Certificat RGE non verifiable sur france-renov.gouv.fr , faux.",
      "Devis qui ne specifie ni epaisseur isolant ni resistance thermique R , vous ne pouvez pas verifier l'eligibilite aides.",
    ],
    questions_devis: [
      {
        q: "Quel isolant exact, et son numero ACERMI ?",
        r: "Refusez 'laine de verre standard'. Exigez : marque (Isover, Knauf, Rockwool, Soprema), reference (Iso Confort 35, Tortue, Comfortbatt), numero ACERMI (verifiable sur acermi.com), R cible.",
      },
      {
        q: "Comment est posee la ventilation, et est-elle conforme NF DTU 24.1 ?",
        r: "VMC simple flux : 1 bouche par piece humide. Double flux : plus efficace mais plus cher. Naturelle : grilles d'aeration en facade. Specifie au devis. Sans : risque condensation.",
      },
      {
        q: "Le pare-vapeur est-il fixe avec film de protection ?",
        r: "Pare-vapeur Vario Knauf, Stamisol Eco, Klober. Pose continue sans dechirure. Au devis : marque + ml. Pas de pare-vapeur = isolation a refaire dans 5 ans, perte d'aides.",
      },
      {
        q: "Quel est le delai de chantier, et qui evacue les dechets ?",
        r: "100 m2 combles : 1 a 2 jours pour soufflage. 50 m2 ITE : 3 a 6 semaines. Dechets a la charge de l'isolier. Si facture en plus : refusable ou negociable.",
      },
      {
        q: "Pouvez-vous me donner 3 references chantiers de moins de 12 mois ?",
        r: "Un poseur serieux fournit reference avec accord client. 'Mme Dupont 89400 Migennes, je peux vous communiquer son numero.' Pas de reference : signal alarme.",
      },
    ],
    cas_concret: {
      titre: "Anatomie d'un chantier isolation combles perdus 100 m2",
      texte: "Sur la fiche pro Sens 89100, le poseur livre : isolation par soufflage de laine de roche Rockwool Jetrock 2, R 7,5 (epaisseur 280 mm soufflee), pare-vapeur Stamisol Eco continu, piges graduees tous les 5 m2 (24 piges visibles). Reprise des trappes acces (3) en isolation pose. VMC simple flux bouches verifiees. Total : 3 200 euros HT (900 euros pose + 2 100 euros materiel + 200 euros piges et accessoires). TVA 5,5 (RGE QualiBat). MaPrimeRenov' : 1 750 euros (menages modestes 25 euros/m2). CEE Coup de Pouce : 1 000 euros. Reste a charge : 450 euros. ROI : 3 ans grace aux 280 euros par an d'economie chauffage.",
    },
    faq: [
      {
        q: "RGE est-il vraiment obligatoire pour les aides ?",
        r: "Oui absolument. Sans RGE : aucune MaPrimeRenov', aucun CEE, aucun eco-PTZ, aucune TVA 5,5. Vous payez plein pot. Verifiez systematiquement sur france-renov.gouv.fr/registre.",
      },
      {
        q: "Quelle est l'isolation la plus rentable ?",
        r: "1) Combles perdus (R 7-8) : ROI 5-7 ans. 2) Murs par interieur (R 4-5) : ROI 8-12 ans. 3) ITE par exterieur (R 4-5) : ROI 12-15 ans mais beneficie a la valorisation patrimoine. 4) Sols (R 3) : ROI 10-15 ans.",
      },
      {
        q: "Laine de verre, laine de roche, ouate de cellulose, laine de bois : quelle difference ?",
        r: "Laine de verre : moins chere, conductivite excellent (0,032), risque sante limites. Laine de roche : ininflammable, idem prix. Ouate de cellulose : ecolo papier, moins cher en France. Laine de bois : ecolo, dephasage thermique meilleur, plus chere.",
      },
      {
        q: "Combien de temps dure une isolation ?",
        r: "Bien posee avec pare-vapeur : 30-50 ans. Mal posee (humidite, tassement) : 5-10 ans. La difference : un poseur RGE qualifie applique le pare-vapeur correctement. L'amateur le saute ou le dechire.",
      },
      {
        q: "Combles amenages : isolation par interieur ou par exterieur (sarking) ?",
        r: "Interieur : moins cher, plus rapide, perd 25-30 cm de hauteur sous plafond. Exterieur (sarking) : plus cher, exige depose toiture, mais hauteur intacte + meilleur thermique. Sarking + refection toiture en meme temps : ROI excellent.",
      },
    ],
    sources: [
      { label: "France Renov' isolation", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-combles" },
      { label: "ACERMI certifications materiaux", url: "https://www.acermi.com/" },
      { label: "ADEME guide isolation", url: "https://librairie.ademe.fr/" },
    ],
  },
];

// CHAUFFAGISTE
GUIDES_METIERS.push({
  metier: "chauffagiste",
  titre: "Comment choisir un bon chauffagiste",
  meta_description: "Certifications RGE QualiPAC, QualiBois, F-Gaz : criteres pour choisir un chauffagiste fiable. Drapeaux rouges et questions a poser, guide 2026.",
  intro: "Le chauffagiste pose et entretient ce qui represente 60 a 70 pourcents de votre facture energie. Mauvais choix : pompe a chaleur surdimensionnee, chaudiere mal regulee, contrat d'entretien abusif. Voici comment trouver le bon.",
  enjeu: "MaPrimeRenov' a transforme le marche : 5 000 euros d'aide possibles sur une PAC air-eau, mais OBLIGATOIREMENT via un artisan RGE QualiPAC. Sans cette certification, vous perdez les aides et la decennale specifique pompes a chaleur.",
  criteres: [
    { titre: "RGE QualiPAC pour pompes a chaleur", description: "Certification ADEME specifique aux PAC. Sans elle : pas d'aides MaPrimeRenov' ni CEE. Verifiable france-renov.gouv.fr.", niveau: "critique" },
    { titre: "RGE QualiBois pour chaudiere bois ou granulés", description: "Equivalent QualiPAC pour le bois energie. Pour beneficier de Coup de Pouce CEE 4 000 euros sur poele granules.", niveau: "critique" },
    { titre: "Certification F-Gaz Categorie 1", description: "Obligatoire pour manipuler les fluides frigorigenes (R32, R410A) au-dela de 2,5 kg. Sans elle : pose PAC ou clim illegale.", niveau: "critique" },
    { titre: "Bilan thermique propose avant devis", description: "Un chauffagiste serieux fait un bilan thermique (Methode 3CL ou DPE) avant de dimensionner. Sans bilan : risque surdimensionnement et facture electrique gonflee.", niveau: "elevee" },
    { titre: "Contrat d'entretien clair et resiliable", description: "L'entretien annuel des chaudieres gaz/fioul est obligatoire (decret 2009-649). Contrat doit specifier P1 (visite) ou P2 (P1 + reparations). Resiliation libre, pas tacite reconductible.", niveau: "elevee" },
  ],
  drapeaux_rouges: [
    "Devis PAC sans bilan thermique prealable , risque surdimensionnement coute 30-50 pourcents en plus.",
    "Promesse 'PAC tout-en-un sans entretien' , menteur, l'entretien biennal est obligatoire.",
    "Contrat d'entretien tacite reconductible avec frais de resiliation , pratique abusive.",
    "Pas de mention F-Gaz sur devis PAC ou clim , artisan illegal sur fluides frigorigenes.",
    "Refus de communiquer le COP/ETAS en condition climat realiste (a -7 degC) , materiel sous-performant.",
  ],
  questions_devis: [
    { q: "Quel est le COP a -7 degC ou l'ETAS de la PAC proposee ?", r: "MaPrimeRenov' impose ETAS >= 126 pourcents. COP nominal a -7 degC : 3,5 minimum. Refusez les COP donnes a +7 degC, biaises." },
    { q: "Avez-vous fait un bilan thermique avant ce devis ?", r: "Reponse esperee : oui, methode 3CL avec rapport ecrit. Si flou : risque surdimensionnement majeur." },
    { q: "Quelle est l'unite exterieure proposee, et son niveau sonore en dB(A) ?", r: "35 a 50 dB(A) typique. Reglement copropriete et arrete bruit voisinage a verifier. Au-dessus de 45 dB(A) : risque litige voisin." },
    { q: "Quel est le delai SAV en cas de panne, et qui le prend en charge ?", r: "Decennale obligatoire + garantie compresseur 5 a 10 ans constructeur. Delai intervention SAV : 48h ouvrees max. A specifier au devis." },
  ],
  cas_concret: {
    titre: "Anatomie d'une pose PAC air-eau 11 kW",
    texte: "Sur la fiche pro Auxerre 89000, le chauffagiste livre : Daikin Altherma 3 H HT 11 kW haute temperature, COP 3,7 a -7 degC, ETAS 132 pourcents. Bilan thermique 3CL prealable. Depose ancienne chaudiere fioul 18 ans, decuve 2000 L. Pose unite ext 38 dB(A) sur dalle isolante anti-vibrations. Reseau radiateurs basse temp adapte. Total : 14 200 euros HT (10 800 materiel + 3 400 pose). TVA 5,5 (RGE). MaPrimeRenov' : 4 000 euros. CEE Coup de Pouce : 4 500 euros. Reste a charge : 5 700 euros.",
  },
  faq: [
    { q: "PAC air-eau ou geothermie : laquelle choisir ?", r: "Air-eau : moins chere (8-15k euros), pas de forage, COP 3-4. Geothermie : plus chere (20-30k euros), forage 80m, COP 4-5 stable. Air-eau optimale en climat tempere, geothermie au-dela de 200 m2 ou climat froid." },
    { q: "Mon ancienne chaudiere fioul est-elle encore legale ?", r: "Oui en 2026, mais interdite a remplacer par une fioul depuis juillet 2022. Si elle tombe en panne : passage obligatoire a PAC, gaz, ou bois. MaPrimeRenov' Coup de Pouce specifique pour sortir du fioul." },
    { q: "L'entretien chaudiere est-il vraiment obligatoire ?", r: "Oui pour gaz, fioul, bois (decret 2009-649). Locataire a la charge sauf bail. Sans attestation a jour : assurance habitation peut refuser garantie en cas de sinistre." },
    { q: "Combien coute une PAC air-eau ?", r: "8 000 a 18 000 euros tout compris selon puissance et performances. Voir nos /tarifs/chauffagiste/. Aides MaPrimeRenov' + CEE peuvent ramener a 3 000-7 000 euros pour menages modestes." },
  ],
  sources: [
    { label: "France Renov' PAC", url: "https://france-renov.gouv.fr/aides/eligibilite/pompe-chaleur" },
    { label: "ADEME guide chauffage", url: "https://librairie.ademe.fr/" },
    { label: "Service Public entretien chaudiere", url: "https://www.service-public.fr/particuliers/vosdroits/F31894" },
  ],
});

// PLAQUISTE
GUIDES_METIERS.push({
  metier: "plaquiste",
  titre: "Comment choisir un bon plaquiste",
  meta_description: "Decennale, isolation phonique, plaques A1 ignifuge : criteres pour choisir un plaquiste fiable. Drapeaux rouges et 4 questions a poser.",
  intro: "Le plaquiste pose les cloisons, faux plafonds, doublages isolants. Travail invisible mais qui dure 30 ans. Une cloison voile, un plafond fissure, un doublage qui s'effrite : difference entre un pro et un improvise.",
  enjeu: "Le placo est un metier d'apparence simple mais technique. Les plaques BA13 standard, hydrofuges, phoniques, ignifuges ont chacune leur usage specifique. Une mauvaise plaque dans une salle de bain = moisissures sous 3 ans. Un mauvais joint = fissures.",
  criteres: [
    { titre: "Decennale travaux de cloisonnement", description: "La decennale standard couvre. Verifiez la mention 'cloisons et plafonds' au contrat.", niveau: "critique" },
    { titre: "Connaissance des plaques specialisees", description: "BA13 standard pour murs interieurs secs. Hydrofuge pour pieces humides. Phonique pour double cloison. Ignifuge pour ERP. Le plaquiste doit connaitre la matrice.", niveau: "critique" },
    { titre: "Maitrise pose ossatures metalliques", description: "Rails et montants F47 ou C48. Ecartement maximal 60 cm pour BA13, 40 cm pour double couche. Verifiez les references.", niveau: "elevee" },
    { titre: "Joints bandes papier ou enduit propre", description: "Bande papier collee + enduit, ponce a sec. Resultat : surface lisse pour peinture. Refuser bandes plastique adhesives (low cost qui se decolle).", niveau: "elevee" },
    { titre: "Photos chantier de plus de 5 ans", description: "Plaquiste serieux a des references avec finition impeccable apres 5 ans. Pas de fissures, pas de joints visibles.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pose de plaques standard en salle de bain , doivent etre hydrofuges (BA13 vert ou bleu).",
    "Refus d'expliquer le type de plaque pose pour chaque piece , generaliste qui ne maitrise pas.",
    "Bandes plastiques adhesives au lieu de bandes papier , solution low cost decollant en 2 ans.",
    "Vis trop espacees (au-dela de 30 cm) , plaque va voile sous chocs.",
    "Pas de pare-vapeur sur doublage isolation , condensation et moisissures dans 3 ans.",
  ],
  questions_devis: [
    { q: "Quelle plaque pour quelle piece ?", r: "Salle de bain : BA13 hydrofuge. Cuisine : BA13 hydrofuge ou standard hauteur 2 m + hydro au-dessus. Chambre : standard. Garage adjacent : ignifuge BA13 BS." },
    { q: "Quelle epaisseur d'isolation interieure proposee ?", r: "ITI 100 mm laine de verre = R 2,5. 120 mm = R 3. 160 mm laine de bois = R 4. Pour MaPrimeRenov' : R >= 3,7 minimum." },
    { q: "Comment poser le pare-vapeur ?", r: "Cote chaud (interieur), continu, jonctions par bandes adhesives etanches. Autour des prises et interrupteurs : manchettes etanches. Sans : isolation perdue en 3 ans." },
    { q: "Avez-vous deja pose des cloisons phoniques (Rw plus de 50 dB) ?", r: "Une cloison phonique est un metier dans le metier. Double ossature desolidarisee + double couche placo + laine de roche. Si flou : choisissez un specialiste." },
  ],
  cas_concret: {
    titre: "Anatomie d'un doublage isolation interieure 50 m2",
    texte: "Sur la fiche pro Sens 89100, le plaquiste livre : ossature metallique F47 ecartement 60 cm, isolation laine de verre Isover 120 mm R = 3,75, pare-vapeur Vario Knauf, plaque BA13 standard. Joints bande papier + enduit Knauf, ponce, pret a peindre. Total : 3 800 euros HT pour 50 m2 (76 euros/m2). TVA 10 (renovation). Eligible MaPrimeRenov' ITI : 750 euros. ROI thermique : 4 a 6 ans en zone H1.",
  },
  faq: [
    { q: "Cloison ou mur porteur, quelle difference ?", r: "Cloison : non porteuse, en placo ou parpaing leger. Mur porteur : structurel, en parpaing 20 cm ou plus. Le plaquiste pose des cloisons. Toucher a un mur porteur = maçon avec etude beton arme." },
    { q: "Combien coute une cloison placo ?", r: "BA13 standard avec laine : 40 a 70 euros/m2. Hydrofuge salle de bain : 55 a 90 euros. Phonique double couche : 80 a 110 euros/m2. Voir nos /tarifs/plaquiste/." },
    { q: "Faux plafond suspendu : utile ?", r: "Si gain plus de 30 cm de hauteur libre, pour cacher gaines/conduits/canalisations. Sinon, plafond direct est moins cher. Phonique : faux plafond avec laine indispensable en immeuble ancien." },
    { q: "Combien de temps pour 30 m2 cloison ?", r: "1 a 2 jours travaux + 1 jour finition (joints, ponce). Total 2 a 3 jours pour piece complete. Sechage joints 24 h avant peinture." },
  ],
  sources: [
    { label: "FFB plaquistes", url: "https://www.ffbatiment.fr/" },
    { label: "France Renov' isolation interieure", url: "https://france-renov.gouv.fr/aides/eligibilite/isolation-murs-interieur" },
  ],
});

// CARRELEUR
GUIDES_METIERS.push({
  metier: "carreleur",
  titre: "Comment choisir un bon carreleur",
  meta_description: "SPEC pieces humides, NF DTU 52.2, joint epoxy : criteres pour choisir un carreleur fiable. Drapeaux rouges et questions a poser, guide 2026.",
  intro: "Le carrelage doit durer 30 a 50 ans. Mal pose, il se fissure, se decolle, devient piege a humidite. Plus que pour aucun autre metier, le diable est dans le detail : etancheite, joint, planeite. Voici comment choisir.",
  enjeu: "La pose carrelage est regie par la NF DTU 52.2. Un carreleur qui ne suit pas le DTU pose un carrelage qui peut casser sous garantie. Pour pieces humides, le SPEC (Systeme Etancheite sous Carrelage) est obligatoire et chacun a son ATEx (Avis Technique d'Experimentation).",
  criteres: [
    { titre: "Connaissance NF DTU 52.2 et SPEC pour pieces humides", description: "Le DTU regle la pose. SPEC (CSTBat, Mapei, Weber) etanche le sol et bas de murs. Sans SPEC en SDB : eaux infiltrees sous carrelage en 3 ans.", niveau: "critique" },
    { titre: "Decennale couvrant carrelage et chape", description: "Decennale standard. Verifier mention 'revetements de sol' incluant chape eventuelle. Si carreleur pose chape : decennale chape requise.", niveau: "critique" },
    { titre: "Maitrise grands formats (60x60 et plus)", description: "Les grand formats (80x80, 120x60, 160x320) demandent une planeite extreme et double encollage. Tout carreleur ne sait pas les poser.", niveau: "elevee" },
    { titre: "Joint epoxy en douche italienne", description: "Joint ciment standard se fissure et noircit sous 5 ans en zone humide. Joint epoxy (Mapei Kerapoxy, Sika SikaCeram-280) etanche et inalterable.", niveau: "elevee" },
    { titre: "Photos de chantiers anciens (douches italiennes 5+ ans)", description: "Une douche italienne 5 ans plus tard sans tache, sans noir aux joints, sans decollement : carreleur de qualite. Demandez les photos.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pas de SPEC en salle de bain ou douche italienne , obligation NF DTU 52.2.",
    "Joint ciment en douche italienne au lieu d'epoxy , prevoir refection joints tous les 3 ans.",
    "Pas de joint de fractionnement tous les 8 m , fissures garanties.",
    "Pose grand format sans double encollage , decollement sous chocs.",
    "Carrelage sur chape humide ou non poncee , adherence faillee.",
  ],
  questions_devis: [
    { q: "Quel SPEC est utilise en pieces humides ?", r: "SPEC Mapei Kerakoll, Weber.tec, Sika MonoSeal. Reference + ATEx au devis. Sans SPEC en SDB : refusez." },
    { q: "Joint ciment ou epoxy en douche ?", r: "Epoxy obligatoire en douche italienne. Ciment classique en sol pieces seches. Le carreleur doit savoir argumenter le choix." },
    { q: "Quelle est la planeite maximale acceptee avant pose ?", r: "+/- 3 mm sur 2 m (NF DTU 52.2). Au-dela : ragreage prealable. Pour grand format : +/- 2 mm sur 2 m." },
    { q: "Quel ecartement entre carreaux pour le grand format ?", r: "2 mm minimum (NF DTU 52.2). Le rectifie permet jusqu'a 1 mm. Refusez 'sans joint' , illegal et fissures garanties." },
  ],
  cas_concret: {
    titre: "Anatomie d'une douche italienne 80x140 cm",
    texte: "Sur la fiche pro Auxerre 89000, le carreleur livre : depose carrelage existant + chape, ragreage Mapei Ultraplan Eco (5 mm), SPEC Mapei Mapegum WPS (membrane etancheite), pose carrelage gres cerame imitation marbre 60x60 (15 mm joints), joint epoxy Mapei Kerapoxy (gris). Pente 1,5 pourcents vers caniveau. Total 8 000 euros TTC TVA 10. Garantie 10 ans (decennale + chape) + 5 ans constructeur joint epoxy.",
  },
  faq: [
    { q: "Combien coute une pose carrelage au m2 ?", r: "Pose seule : 30 a 80 euros/m2 selon format et complexite. Fourniture : 20 a 100 euros/m2. Total tout compris : 50 a 180 euros/m2. Voir /tarifs/carreleur/." },
    { q: "Carrelage sur ancien parquet, possible ?", r: "Oui avec primaire d'accrochage specifique et fibres dans le ragreage. Mais souvent depose parquet preferable pour qualite long terme et hauteur conservee." },
    { q: "Joint epoxy ou ciment ?", r: "Epoxy : etanche, durable 30+ ans, plus cher (40 euros/sac vs 5 euros/sac). Ciment : standard, a refaire 5-10 ans en zone humide. Recommande epoxy en SDB et cuisine." },
    { q: "Combien de temps de chantier pour 20 m2 ?", r: "1,5 a 2 jours pose + 1 jour sechage avant utilisation pieton. 21 jours pour reception complete avec joint epoxy seche." },
  ],
  sources: [
    { label: "CSTB NF DTU 52.2 carrelage", url: "https://www.cstb.fr/" },
    { label: "Capeb carreleurs", url: "https://www.capeb.fr/" },
  ],
});

// PEINTRE
GUIDES_METIERS.push({
  metier: "peintre",
  titre: "Comment choisir un bon peintre",
  meta_description: "Decennale, NFT 36-005, peinture A+ : criteres pour choisir un peintre fiable. Drapeaux rouges et questions a poser, guide editorial 2026.",
  intro: "La peinture parait simple. Mais entre une mise en peinture qui dure 15 ans et une qui peluche en 2 ans, il y a un monde : preparation des supports, qualite des produits, technique de pose. Voici comment choisir.",
  enjeu: "Une mise en peinture interieure complete coute 25 a 60 euros/m2. Une renovation facade : 30 a 90 euros/m2. Mauvais peintre : decollement, jaunissement, traces visibles. Bon peintre : finition impeccable et durable.",
  criteres: [
    { titre: "Decennale interieur ET exterieur si facade", description: "Decennale couvre 10 ans pour facades. Pour interieur : decennale standard sur enduits, garantie biennale sur mise en peinture.", niveau: "critique" },
    { titre: "Maitrise NFT 36-005 finitions", description: "La norme classifie les finitions : A (impeccable), B (courante), C (economique). Au devis, exigez 'finition A' pour pieces a vivre.", niveau: "critique" },
    { titre: "Peintures classees A+ COV bas", description: "COV = Composes Organiques Volatiles. A+ (moins de 1000 microgrammes/m3) recommande pour interieur. Marques : Tollens, Seigneurie, Allios, Astral.", niveau: "elevee" },
    { titre: "Preparation des supports detaillee", description: "Lessivage, ponce, rebouchage, sous-couche : 50 a 70 pourcents du temps de chantier. Un devis qui ne le mentionne pas = peintre rapide qui zappe la prepa.", niveau: "elevee" },
    { titre: "Photos de chantiers ancien (5+ ans)", description: "Demandez photos de cuisines/sdb peintes 5 ans plus tot. Pas de jaunissement, pas de decollement = peintre de qualite.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pas de mention preparation supports (lessivage, ponce, rebouchage) , peintre qui zappe l'essentiel.",
    "Peintures sans certification A+ ou marque inconnue , risque odeurs et durabilite limitee.",
    "Pose 1 couche unique au lieu de 2 minimum , garantie tenue 50 pourcents du temps.",
    "Pas de protection mobilier ou sols , degats collateraux probables.",
    "Pas de pose ruban de masquage propre , debords sur plinthes et corniches.",
  ],
  questions_devis: [
    { q: "Combien de couches sont prevues, et a quelle dilution ?", r: "Standard : 1 sous-couche + 2 couches finition. En cas de changement clair vers fonce : 3 couches finition. Dilution 5-10 pourcents max sur sous-couche." },
    { q: "Quelle marque de peinture, et son numero NF Environnement ?", r: "Tollens Plenitude, Seigneurie Phenix, Allios MotoMix, Astral Velours. Reference exacte au devis. NF Environnement = qualite sanitaire." },
    { q: "Comment sont protege les sols, mobiliers et fenetres ?", r: "Films plastique sols (etalable), bache mobilier ou enlevement, ruban de masquage Tesa basic ou Frog Tape. Au devis." },
    { q: "Quel est le temps de sechage avant remise en service ?", r: "Acrylique : 12-24h pour pieton, 7 jours pour mobilier lourd. Glycerophtalique : 48-72h, 7 jours mobilier. A specifier au devis." },
  ],
  cas_concret: {
    titre: "Anatomie d'une mise en peinture salon 30 m2",
    texte: "Sur la fiche pro Sens 89100, le peintre livre : protection sols films + bache mobilier, lessivage murs + plafond, rebouchage 2 fissures legeres, ponce 240 grain, sous-couche Tollens Phenix Sub Adhesive (1 couche), finition Tollens Phenix Velours blanc (2 couches mat). 30 m2 mur + 25 m2 plafond. Total : 1 350 euros TTC (45 euros/m2 mur fini, 22 euros/m2 plafond). TVA 10 (renovation). Sechage 24h avant utilisation, 7 jours mobilier lourd.",
  },
  faq: [
    { q: "Acrylique ou glycero ?", r: "Acrylique : standard, eco, sans odeur, nettoyage eau. Glycerophtalique : ultra-resistante, lessivable, recommendee SDB et cuisine. Mais odeur forte sechage long. Hybrides 'glycero a l'eau' combinent les 2." },
    { q: "Peinture decorative vs standard ?", r: "Standard : 25 a 50 euros/m2. Decorative (effet ferre, beton cire, tadelakt, stuc venitien) : 50 a 250 euros/m2. ROI deco : 1 piece focal max, sinon casse l'unite." },
    { q: "Combien de temps une mise en peinture ?", r: "Piece 20 m2 : 2-3 jours preparation + 2 jours peinture = 4-5 jours total. Maison 100 m2 : 3 a 4 semaines. Facade 200 m2 : 5-10 jours selon meteo." },
    { q: "Ravalement de facade : obligatoire ?", r: "Tous les 10 ans dans 130 communes (loi 1903). Verifiez en mairie. Penalites jusqu'a 3 750 euros si mise en demeure non suivie." },
  ],
  sources: [
    { label: "FFB peintres", url: "https://www.ffbatiment.fr/" },
    { label: "ANAH ravalement aides", url: "https://www.anah.fr/" },
  ],
});

// SERRURIER
GUIDES_METIERS.push({
  metier: "serrurier",
  titre: "Comment choisir un bon serrurier (et eviter les arnaques)",
  meta_description: "A2P, depannage, devis legal : criteres pour choisir un serrurier fiable et eviter les arnaques. Drapeaux rouges et 4 questions a poser.",
  intro: "Le serrurier est le metier le plus arnaque en France. Le scenario classique : porte claquee, panique, premier numero google, surfacturation 1 500 euros pour un demi-tour de cle. Voici comment ne pas se faire avoir.",
  enjeu: "La DGCCRF traite des centaines de plaintes serruriers par an. Tarifs nuit gonfles, fausse 'serrure haute securite' a 3 000 euros, refus d'attestation. Connaitre ses droits avant l'urgence est imperatif.",
  criteres: [
    { titre: "Certification A2P pour cylindres et serrures", description: "Norme CNPP qui mesure resistance effraction. A2P 1 etoile = 5 min, 2 etoiles = 10 min, 3 etoiles = 15 min. Decote assurance habitation jusqu'a 15 pourcents avec A2P 3 etoiles.", niveau: "critique" },
    { titre: "Tarifs nuit/dimanche/ferie clairement affiches", description: "La majoration legale est limitee a 100 pourcents du tarif jour. Au-dela : abus. L'artisan doit afficher les tarifs avant intervention.", niveau: "critique" },
    { titre: "Devis ECRIT obligatoire au-dela de 100 euros TTC", description: "Article L.111-1 Code conso. Sans devis ecrit signe : intervention illegale. Vous pouvez refuser de payer.", niveau: "critique" },
    { titre: "Numero SIRET visible sur fourgon et flyer", description: "Sirenable sur sirene.gouv.fr ou via /outils/verifier-siret/. Une entreprise active avec plus de 5 ans = signal fiabilite.", niveau: "elevee" },
    { titre: "Photo de la serrure existante avant casse", description: "Un serrurier honnete tente d'abord la manipulation manuelle. Si echec : photo de la serrure pour preuve avant percement (qui detruit). Sans photo : deplacement express prefabriquant.", niveau: "elevee" },
  ],
  drapeaux_rouges: [
    "Flyer 'serrurier ouverture porte 50 euros' mais facture finale 800 euros , pratique trompeuse classique.",
    "Refus de devis ecrit pour intervention superieur a 100 euros TTC , illegal.",
    "Casse systematique de la serrure sans tenter manipulation manuelle , deplacement gonflé.",
    "Vente de cylindre 'haute securite' a 600 euros + pose 400 euros , prix 5x marche normal.",
    "Demande paiement integral en especes , a refuser, exiger CB ou cheque (preuve).",
  ],
  questions_devis: [
    { q: "Pouvez-vous tenter d'abord une manipulation manuelle (slam-pulling) avant de casser ?", r: "Un serrurier serieux y arrive sur 70 pourcents des portes claquees sans clef. Sans tentative : il prefere casser pour facturer plus." },
    { q: "Quelle est la marque exacte du cylindre propose, et son niveau A2P ?", r: "Picard, Fichet, Bricard, Vachette. Niveau A2P 1, 2 ou 3 etoiles. Refusez 'cylindre haute securite' sans marque et certification." },
    { q: "Quelle est la majoration nuit/dimanche/ferie applicable ?", r: "Maximum 100 pourcents du tarif jour ouvre (loi). Affichage obligatoire. Au-dela : pratique abusive a denoncer DGCCRF." },
    { q: "Avez-vous un numero SIRET et une carte professionnelle ?", r: "SIRET verifiable sur sirene.gouv.fr. Carte CNPP A2P optionnelle mais bon signal qualite. Sans SIRET : faux artisan." },
  ],
  cas_concret: {
    titre: "Anatomie d'une intervention serrurier honnete",
    texte: "Sur la fiche pro Auxerre 89000, le serrurier intervient sur porte claquee dimanche 14h : tentative slam-pulling 15 min reussie. Devis sur place : 180 euros TTC (90 euros forfait dimanche + 90 euros main d'oeuvre 1h max). Paiement CB. Aucune casse. Conseille au client de faire double cle de secours chez voisin. Au comparable, un escroc aurait casse la porte d'emblee et facture 1200 euros pour casse + cylindre 'haute securite' bidon.",
  },
  faq: [
    { q: "Combien coute une intervention serrurier ?", r: "Ouverture porte sans degats : 90 a 350 euros (selon heure). Avec cylindre change : 200 a 500 euros. Porte blindee : 1 500 a 5 500 euros. Voir /tarifs/serrurier/." },
    { q: "Comment recourir contre une surfacturation ?", r: "1) Refusez de payer plus que le devis ecrit. 2) Si paiement CB ou cheque : Banque de France peut bloquer. 3) Saisir DGCCRF (signalconso.fr). 4) Plainte pour escroquerie au commissariat." },
    { q: "A2P 1, 2 ou 3 etoiles : difference ?", r: "1 etoile : resiste 5 min, decote assurance 5 pourcents. 2 etoiles : 10 min, 10 pourcents. 3 etoiles : 15 min, 15 pourcents. Le delta prix vaut largement la decote assurance sur 10 ans." },
    { q: "Faut-il ouvrir la porte avant l'arrive du serrurier ?", r: "Non. Pas de cle, pas de force. Attendez. Si urgence (enfant a l'interieur, gaz qui fuit) : pompiers gratuit." },
  ],
  sources: [
    { label: "CNPP certification A2P", url: "https://www.cnpp.com/" },
    { label: "DGCCRF arnaques serruriers", url: "https://www.economie.gouv.fr/dgccrf/Publications" },
    { label: "Signal Conso plainte", url: "https://signal.conso.gouv.fr/" },
  ],
});

// MAÇON
GUIDES_METIERS.push({
  metier: "macon",
  titre: "Comment choisir un bon macon",
  meta_description: "Decennale, Qualibat, NF EN 206-1 : criteres pour choisir un macon fiable. Drapeaux rouges et questions a poser, guide editorial 2026.",
  intro: "Le macon construit ce qui dure 100 ans. Mauvais macon : fissures, infiltrations, mur qui s'incline en 5 ans. Le metier est dur a evaluer pour un particulier. Voici comment trier le bon grain.",
  enjeu: "Une fondation, un mur porteur, une dalle : tout est statique et se voit pas avant 10 ans. La decennale couvre, mais la procedure est longue (3-5 ans avant indemnisation). Mieux vaut bien choisir des le depart.",
  criteres: [
    { titre: "Qualibat 1111 a 1311 pour gros oeuvre", description: "1111 : maçonnerie courante. 1112 : technicite confirmee. 1311 : elements porteurs maitrises. Verifiable sur qualibat.com.", niveau: "critique" },
    { titre: "Decennale specifique 'gros oeuvre'", description: "Decennale standard ne suffit pas. Mention 'maçonnerie generale et fondations' au contrat. Pour piscine, citerne, ouvrage particulier : decennale specifique.", niveau: "critique" },
    { titre: "Beton dose selon NF EN 206-1", description: "Le beton ne se 'fait au pif'. Dosage cimentier selon usage : 250 kg/m3 pour beton de proprete, 350 kg/m3 pour beton arme. Demandez le dosage au devis.", niveau: "critique" },
    { titre: "Etude d'execution pour ouvrage > 5 m linea", description: "Pour mur de soutenement, fondation profonde : etude beton arme par bureau d'etudes. Sans etude : ouvrage sous-dimensionne, fissures garanties.", niveau: "elevee" },
    { titre: "Photos d'ouvrages anciens (10+ ans)", description: "Mur monte 10 ans plus tot toujours droit, dalle sans fissures, beton imprime intact : signal qualite.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Beton dose 'a l'oeil' sans cimentier dose , risque resistance sous-dimensionnee.",
    "Pas d'etude beton arme pour ouvrage de plus de 5 m , fissures garanties dans 5 ans.",
    "Pas de chainage horizontal et vertical sur mur porteur , non conforme NF DTU 20.1.",
    "Coulage beton sous pluie battante ou par temperature negative , prise compromise.",
    "Pas de joint de dilatation sur dalle de plus de 6 m , fissures attendues.",
  ],
  questions_devis: [
    { q: "Quel dosage cimentier (en kg/m3) pour le beton ?", r: "250 kg/m3 = beton proprete. 350 kg/m3 = beton arme. 400 kg/m3 = beton hautes performances. A specifier au devis selon usage." },
    { q: "Y aura-t-il chainage horizontal et vertical ?", r: "Chainage horizontal en haut et bas de mur porteur, vertical aux angles et tous les 5 m. Norme NF DTU 20.1. Sans : mur peut s'effondrer." },
    { q: "Quel ferraillage pour la dalle (treillis, fibres) ?", r: "Treillis 5 mm a 5x5 cm minimum sous dalle de plus de 6 m2. Double treillis pour grande portee. Fibres metalliques pour dalle industrielle." },
    { q: "Avez-vous fait une etude beton pour mon mur de soutenement ?", r: "Tout mur de plus de 1,50 m exige etude beton arme. Bureau d'etudes (~600 a 1 200 euros) externe au macon. Sans etude : refus." },
  ],
  cas_concret: {
    titre: "Anatomie d'une dalle beton 50 m2 garage",
    texte: "Sur la fiche pro Auxerre 89000, le macon livre : decapage terre vegetale 30 cm, lit drainage galets 20 cm, treillis double 5x5 cm, beton 350 kg/m3 epaisseur 15 cm dose chez Lafarge avec bon de pesee. Joints dilatation a 5 m. Niveau laser. Total : 4 200 euros HT (84 euros/m2). TVA 10. Sechage 21 jours avant carrelage, 28 jours pour charge complete. Garantie decennale.",
  },
  faq: [
    { q: "Combien coute un mur en parpaing ?", r: "80 a 180 euros/m2 selon hauteur, epaisseur (15, 20 ou 25 cm) et chainage. Voir /tarifs/macon/. Mur de cloture jusqu'a 2 m sans declaration; au-dela DP." },
    { q: "Faut-il un permis pour terrasse ?", r: "DP obligatoire au-dela de 5 m2 (ou 40 m2 en zone constructible si moins de 60 cm de hauteur). Si zone protegee : permis." },
    { q: "Combien de temps de sechage avant carrelage sur dalle neuve ?", r: "21 jours pour un beton standard. 28 jours pour reception complete avec charge. Eau libre dans le beton fait gonfler le carrelage." },
    { q: "Mur porteur ou cloison ?", r: "Mur porteur supporte plancher/toiture, fondations renforcees, decennale specifique. Cloison : aucun role structurel, en placo ou parpaing leger." },
  ],
  sources: [
    { label: "FFB maçons", url: "https://www.ffbatiment.fr/" },
    { label: "CSTB beton normes", url: "https://www.cstb.fr/" },
  ],
});

// JARDINIER
GUIDES_METIERS.push({
  metier: "jardinier",
  titre: "Comment choisir un bon jardinier paysagiste",
  meta_description: "Certiphyto, decennale, credit impot SAP : criteres pour choisir un jardinier-paysagiste fiable. Drapeaux rouges et 4 questions a poser.",
  intro: "Un jardin, ca demande d'etre entretenu sinon ca redevient nature. Mais entre un voisin qui tond et un paysagiste qui concoit + entretient, le delta est immense. Voici comment choisir.",
  enjeu: "Le service a la personne (SAP) jardin beneficie de 50 pourcents de credit d'impot jusqu'a 5 000 euros/an. C'est un avantage fiscal majeur , mais reserve aux entreprises declarees Cesu ou organismes agrees. Verifier l'eligibilite est crucial.",
  criteres: [
    { titre: "Cesu ou organisme agrement SAP", description: "Pour beneficier du credit d'impot 50 pourcents, l'entreprise doit etre declaree au registre national SAP. Verifiable sur servicesalapersonne.gouv.fr.", niveau: "critique" },
    { titre: "Certiphyto si traitements phytosanitaires", description: "Pour pulveriser desherbants, fongicides, insecticides : certificat Certiphyto obligatoire. Sans : intervention illegale. Acces public www.actiphytotraite.fr.", niveau: "critique" },
    { titre: "MSA ou URSSAF declares (cotisation)", description: "Une entreprise qui declare ses salaries paie MSA (mutualite sociale agricole) ou URSSAF. Au noir : pas d'assurance, pas de credit impot, ouvrier non couvert.", niveau: "elevee" },
    { titre: "Materiel propre et bien entretenu", description: "Tondeuses, taille-haies, tronconneuses electriques bien afflutees = travail propre. Materiel rouille ou casse : signal de bricolage.", niveau: "elevee" },
    { titre: "Photos jardin avant/apres et entretien duree", description: "Jardin entretenu 3 ans plus tard avec haie taillee impeccablement : signal qualite. Photos avant/apres systematiques.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pas declaration Cesu ou SAP , pas de credit d'impot, signal au noir.",
    "Traitement chimique sans Certiphyto , illegal et risques sanitaires.",
    "Devis sans facture (paiement especes) , au noir, vous etes complice.",
    "Tronconnage arbre sans equipement (harnais, casque, protections) , danger pour vous et eux.",
    "Vente intempestive de produits 'phytosanitaires speciaux' , souvent simples desherbants gonflés.",
  ],
  questions_devis: [
    { q: "Etes-vous declares au registre SAP, et eligibles credit d'impot 50 pourcents ?", r: "Oui : numero SAP fournit a la signature, attestation de credit d'impot envoyee fin de chaque trimestre. Sans : pas declarees." },
    { q: "Pour traitement chimique, avez-vous le Certiphyto ?", r: "Si oui : reference du certificat. Si non : refusez l'intervention chimique, demandez alternatives bio (paillage, eau bouillante, vinaigre)." },
    { q: "Combien de visites par mois, et duree par visite ?", r: "Forfait mensuel : 3-4 visites. Heures par visite : 2-4. Materiel apporte. Heures supplementaires facturees au tarif horaire (40-70 euros)." },
    { q: "Que faites-vous des dechets verts ?", r: "Compostage sur place (gratuit) ou evacuation dechetterie (payante). Au devis. Pas d'evacuation en bord de route (illegal)." },
  ],
  cas_concret: {
    titre: "Anatomie d'un contrat entretien jardin 1000 m2",
    texte: "Sur la fiche pro Sens 89100, le paysagiste livre : contrat annuel jardin 1000 m2 (10 ares). 4 visites mensuelles avril-octobre, 2 par mois novembre-mars (24 visites/an). Tonte, taille haies, debroussaillage, ramassage feuilles. Certiphyto : oui. Forfait 2 400 euros TTC/an. Eligible credit impot 50 pourcents = reste a charge 1 200 euros. Materiel apporte. Compostage sur place.",
  },
  faq: [
    { q: "Quelle distance plantation au mur du voisin ?", r: "0,5 m pour haie de moins de 2 m, 2 m pour plus de 2 m (article 671 Code Civil). Si voisin demande l'elagage : obligation absolue. Litige : tribunal de proximite." },
    { q: "Quand planter ?", r: "Octobre a mars hors gel : plants en racines nues (moins chers). Toute l'annee : plants en pot. Eviter ete (chaleur stress). Charmille pousse 1m/an, laurier 1,5m/an." },
    { q: "Combien coute une haie ?", r: "80 a 350 euros/ml selon essence, hauteur, densite. Charmille standard 1,5 m + plantation : 130-220 euros/ml. Haie persistante mixte : 220-350 euros/ml. Voir /tarifs/jardinier/." },
    { q: "Tonte gazon : quelle frequence ?", r: "1x/semaine en saison (avril-octobre). 2x/mois hors saison. Hauteur de coupe 4-5 cm en pleine canicule, 3 cm en automne. Mulching evite ramassage." },
  ],
  sources: [
    { label: "Service Public credit impot SAP", url: "https://www.service-public.fr/particuliers/vosdroits/F12330" },
    { label: "Certiphyto verification", url: "https://e-phy.agriculture.gouv.fr/" },
  ],
});

// CLIMATICIEN
GUIDES_METIERS.push({
  metier: "climaticien",
  titre: "Comment choisir un bon climaticien",
  meta_description: "F-Gaz, QualiPAC, fluide R32 : criteres pour choisir un climaticien fiable. Drapeaux rouges et 4 questions a poser, guide editorial 2026.",
  intro: "La climatisation reversible chauffe ET rafraichit, et coute moitie moins en electricite qu'un convecteur. Mais entre un installateur improvise et un climaticien qualifie, l'ecart de durabilite est de 5 a 15 ans. Voici la grille editoriale.",
  enjeu: "Le marche climatisation explose en France (10 pourcents du parc, +40 pourcents en 5 ans). Les fluides frigorigenes sont reglementes (F-Gaz). Sans certification F-Gaz, l'artisan ne peut legalement manipuler les unites. Et la decennale ne couvre pas une installation illegale.",
  criteres: [
    { titre: "Certification F-Gaz Categorie 1", description: "Obligatoire pour manipuler tous fluides (R32, R410A, R22 retire). Categorie 1 = manipulation libre, 2 = sous controle, 3 = nettoyage uniquement. Sans Cat 1 : pose illegale.", niveau: "critique" },
    { titre: "RGE QualiPAC pour aides MaPrimeRenov'", description: "Pas pour la clim seule (plus eligible MaPrimeRenov' depuis 2022) mais pour les climatiseurs reversibles a haute performance pour CEE Coup de Pouce 50-200 euros si remplacement chaudiere.", niveau: "elevee" },
    { titre: "Bilan thermique avant dimensionnement", description: "Une clim surdimensionnee gaspille 30 pourcents d'energie. Le climaticien doit dimensionner au m3 a refroidir + isolation. Sans bilan : erreur garantie.", niveau: "elevee" },
    { titre: "Decennale specifique climatisation", description: "Decennale standard plus mention 'fluides frigorigenes'. Sans : refus de garantie en cas de fuite fluide.", niveau: "critique" },
    { titre: "Photos chantiers et niveau sonore unite ext", description: "35 a 50 dB(A). Reglement copropriete + arrete bruit voisin a verifier. Photos chantiers anciens : qualite installation visible.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pas de certification F-Gaz Cat 1 , illegal et garantie nulle.",
    "Promesse 'pose simple sans bilan thermique' , surdimensionnement et facture electrique gonflee.",
    "Fluide propose : R22 (retire 2010) ou R410A (en sortie progressive) , prevoir remplacement futur cher.",
    "Pas de mention reglement copropriete pour pose unite ext sur facade , risque AG annule pose.",
    "Tarifs TTC bas pour multi-split avec marque inconnue , installation low cost SAV inexistant.",
  ],
  questions_devis: [
    { q: "Quelle est votre certification F-Gaz, et son numero ?", r: "Cat 1 obligatoire. Numero verifiable sur ademe.fr/manipulation-fluides. Refusez sans certificat." },
    { q: "Quel fluide frigorigene est utilise dans le climatiseur propose ?", r: "R32 (faible PRG, en cours) recommande. R410A : sortie progressive, plus cher a recharger. R22 : interdit depuis 2010, refusez absolument." },
    { q: "Avez-vous fait un bilan thermique avant ce devis ?", r: "Methode 3CL ou estimation 30-50 W/m2 isole, 60-80 W/m2 mal isole. Pour 70 m2 isolation moyenne : 4-5 kW max. Refusez surdimensionnement." },
    { q: "Quel est le niveau sonore en dB(A) de l'unite exterieure proposee ?", r: "Daikin Comfora 35 dB(A) chuchote, Mitsubishi MSZ-AP 40 dB(A) discret, Atlantic 45-50 dB(A) audible. Reglement bruit voisin : moins de 40 dB(A) recommande." },
  ],
  cas_concret: {
    titre: "Anatomie d'une pose mono-split 3,5 kW reversible",
    texte: "Sur la fiche pro Auxerre 89000, le climaticien livre : Daikin Comfora ATXM35R 3,5 kW reversible, fluide R32, COP chauffage 4,3 a 7 degC, EER refroid 3,7. Bilan thermique 3CL avant. Pose unite ext 35 dB(A) sur dalle isolante anti-vibrations, hauteur > 1 m sol. Liaison cuivre 5 m. Niveau sonore unite int 19 dB(A) silence. Total : 2 800 euros HT. TVA 10 (reno). Garantie 2 ans constructeur fabricant + 5 ans pieces compresseur + 10 ans decennale installation.",
  },
  faq: [
    { q: "MaPrimeRenov' couvre-t-elle la climatisation ?", r: "Plus depuis 2022 (climatiseurs reversibles seuls exclus). Restent : CEE Coup de Pouce 50-200 euros si remplacement chaudiere, et eco-PTZ jusqu'a 30 000 euros bouquet renovation." },
    { q: "Quelle puissance de climatisation pour 70 m2 ?", r: "35-50 W/m2 = 2,5 a 3,5 kW pour bonne isolation. 60-80 W/m2 = 4-5,6 kW pour isolation moyenne. Mauvais isolement : 90+ W/m2 = 6+ kW (mais vraiment investir dans isolation prealable)." },
    { q: "Mono-split ou multi-split : que choisir ?", r: "Mono-split : 1 unite int. Cle, panne ne propage pas. Multi-split : 1 unite ext + 2-5 unites int, plus esthetique mais panne ext = panne tous splits. ROI moyen : multi-split rentable a partir de 3 unites." },
    { q: "Entretien annuel obligatoire ?", r: "Oui pour tout systeme plus de 4 kW (decret 2020-912). 1 visite tous les 2 ans. Cout 100-220 euros. Sans visite : performance baisse, garantie constructeur peut etre annulee." },
  ],
  sources: [
    { label: "ADEME F-Gaz reglementation", url: "https://www.ademe.fr/" },
    { label: "Service Public entretien climatisation", url: "https://www.service-public.fr/" },
  ],
});

// CUISINISTE
GUIDES_METIERS.push({
  metier: "cuisiniste",
  titre: "Comment choisir un bon cuisiniste",
  meta_description: "Pose interne, garanties, paiement securise : criteres pour choisir un cuisiniste fiable. Drapeaux rouges et questions a poser.",
  intro: "Une cuisine, c'est 5 000 a 30 000 euros, 8 a 12 semaines de fabrication, et 20 ans de quotidien. C'est l'achat le plus engageant apres l'immobilier. Le cuisiniste qui pose bien fait economiser des annees de regrets.",
  enjeu: "Le marche cuisine est domine par les enseignes (Schmidt, Mobalpa, Cuisinella, IKEA Pose). Les ecarts qualite/prix sont enormes. Comprendre l'integration verticale (fabrication, pose, SAV) est essentiel pour eviter les mauvaises surprises.",
  criteres: [
    { titre: "Pose interne ou sous-traitee ?", description: "Pose interne (avec poseurs salaries) = SAV reactif. Pose sous-traitee (intermittents, auto-entrepreneurs) = SAV plus difficile. Demandez explicitement.", niveau: "critique" },
    { titre: "Garantie caissons et plan de travail (5 ans min)", description: "Decennale obligatoire installation. Constructeur : 5 ans caissons (Schmidt, Mobalpa premium), 2 ans appareils, 10 ans plan quartz/granit. Au devis.", niveau: "critique" },
    { titre: "Paiement echelonne et securise", description: "30 pourcents commande, 30 pourcents fabrication, 40 pourcents pose. Refusez 100 pourcents acompte. Paiement CB ou cheque (preuve), JAMAIS especes.", niveau: "critique" },
    { titre: "SAV interne et delais reaction", description: "Intervention SAV : 7 a 14 jours ouvres max. Avec poseurs salaries en regie : reactif. Avec sous-traitants : delais peuvent monter a 2-3 mois.", niveau: "elevee" },
    { titre: "Visite metreur sur site obligatoire", description: "Devis sans metrage = approximatif. Visite metreuse + plan 3D + signature definitive avant fabrication = process serieux.", niveau: "elevee" },
  ],
  drapeaux_rouges: [
    "Promesse 'cuisine sur-mesure' a moins de 7 000 euros , c'est forcement assemblage de pieces standard.",
    "Demande 100 pourcents acompte avant fabrication , refusez systematiquement.",
    "Refus de signer plan 3D et metrage definitif , risque ecart entre devis et facture.",
    "Pose sous-traitee a auto-entrepreneur sans garantie SAV , reactivite SAV nulle.",
    "Marque inconnue ou 'fabrication europeenne' sans precision , souvent imports asiatiques.",
  ],
  questions_devis: [
    { q: "Vos poseurs sont-ils salaries internes ou sous-traitants ?", r: "Salaries : SAV reactif, formation continue. Sous-traitants : moins controlable. Le cuisiniste serieux est transparent." },
    { q: "Quel sont les delais de fabrication et de pose ?", r: "Sur-mesure standard : 6 a 10 semaines. Premium : 10 a 14 semaines. Pose : 2 a 4 jours selon complexite. Penalites de retard : 1/3000 par jour ouvre." },
    { q: "Quelle est la garantie sur caissons, faces et plan de travail ?", r: "Caissons : 5 ans (premium 10 ans). Faces : 2 a 5 ans. Plan quartz/granit : 10 ans. Electromenager : 2 ans + extensions possibles. Demandez par ecrit." },
    { q: "Comment se passe le SAV apres pose en cas de probleme ?", r: "Numero direct cuisiniste poseur, intervention sous 7-14 j ouvres. Defaut visible reception : retouche immediate ou demarche garantie." },
  ],
  cas_concret: {
    titre: "Anatomie d'une cuisine sur mesure 4 m + ilot",
    texte: "Sur la fiche pro Sens 89100, le cuisiniste livre : cuisine en L 4,2 ml + ilot 1,8 m, faces laque mat blanc Schmidt, caissons stratifie, plan quartz Silestone Eternal Calacatta Gold (4 m + ilot 1,8 m), credence carrelage metro. Electromenager : four pyrolyse, plaque induction 4 zones, hotte ilot 60 dB, lave-vaisselle 14 couverts. Total : 17 800 euros TTC. Acompte 30 pourcents 5 340 euros. Fabrication 8 semaines. Pose 2,5 jours. Garantie 5 ans caissons + 10 ans quartz + 2 ans electromenager.",
  },
  faq: [
    { q: "Combien coute une cuisine equipee ?", r: "Standard IKEA-type : 3 500 a 6 000 euros. Moyen de gamme Schmidt/Cuisinella : 6 000 a 12 000 euros. Premium Mobalpa/Bulthaup : 14 000 a 30 000 euros. Voir /tarifs/cuisiniste/." },
    { q: "Quartz, granit, stratifie ou inox : que choisir ?", r: "Stratifie : moins cher, vie 10-15 ans. Quartz Silestone : non poreux, 10 ans garantie, durable 20-30 ans. Granit : motif unique, hydrofuge tous les 2 ans. Inox : solide, marque facile." },
    { q: "Faut-il pour avoir un ilot central ?", r: "Passage minimum autour : 1 m, 1,2 m recommande. Sur dalle : plomberie possible. Sur plenum : eviter, complexe. Hotte ilot ajoute 1 500 a 3 000 euros." },
    { q: "Quel est le delai de fabrication ?", r: "8 a 12 semaines apres metrage definitif (16 semaines en haute saison). Pose 2-4 jours apres fabrication. Total 3 a 4 mois entre signature et utilisation." },
  ],
  sources: [
    { label: "FCC Federation cuisinistes", url: "https://www.fcc-france.fr/" },
    { label: "DGCCRF acompte cuisine", url: "https://www.economie.gouv.fr/dgccrf/Publications" },
  ],
});

// PARQUETEUR
GUIDES_METIERS.push({
  metier: "parqueteur",
  titre: "Comment choisir un bon parqueteur",
  meta_description: "UFFEP membre, decennale, vitrification : criteres pour choisir un parqueteur fiable. Drapeaux rouges et 4 questions a poser, guide 2026.",
  intro: "Un parquet bien pose dure 50 a 100 ans. Mal pose : grincements, bombements, lames qui s'ecartent en 5 ans. Le metier est specifique , peu d'artisans le maitrisent vraiment. Voici comment trier.",
  enjeu: "Massif chene 22 mm + pose collee bien faite + vitrification 3 couches = sol qui passe les generations. Lames flottantes premium + sous-couche phonique + finition impeccable = compromis intelligent. Mauvais parqueteur : sol qui grince, lames qui se decollent, vitrification ravinee.",
  criteres: [
    { titre: "Membre UFFEP ou Federation Francaise du Bois", description: "L'UFFEP regroupe les vrais parqueteurs. Cotisants : artisans formes a la NF DTU 51.2 (parquet) et 51.3 (revetements). Verifiable uffep.fr.", niveau: "critique" },
    { titre: "Decennale specifique parquetage", description: "Verifiez 'pose de parquet et revetements bois' au contrat decennal. Sans : parqueteur improvise.", niveau: "critique" },
    { titre: "Maitrise pose flottante, collee et clouée", description: "Flottante : facile, faible budget. Collee : durable, sols beton ou chauffant. Clouée : massif sur lambourdes, traditionnelle. Le pro maitrise les 3.", niveau: "critique" },
    { titre: "Vitrification 3 couches polyurethane", description: "Standard : 1 couche bouche-pores + 3 couches finition polyurethane mate ou satinee. Refusez 'vitrification 1 couche' (tient 2 ans). Marques Bona, Loba, Berger-Seidle.", niveau: "elevee" },
    { titre: "Photos chantier de plus de 5 ans", description: "Parquet pose 5 ans plus tot toujours impeccable, sans rayures profondes ni decoloration : signal qualite.", niveau: "utile" },
  ],
  drapeaux_rouges: [
    "Pose parquet sur sol non plane (plus de 3 mm/m) sans ragreage prealable , bombements garantis.",
    "Vitrification 1 couche au lieu de 3 , finition tient 2 ans.",
    "Pose flottante en cuisine ou SDB sans pare-vapeur , gonflement humidite.",
    "Pas de joint de dilatation perimetral 8-10 mm , parquet bombe en hiver.",
    "Pose collee sans primaire d'accrochage sur beton frais , decollement.",
  ],
  questions_devis: [
    { q: "Quel type de parquet, et son grade (Premier, Premier choix, Standard) ?", r: "Premier : sans noeuds visibles, plus cher. Premier choix : quelques noeuds, milieu de gamme. Standard : noeuds nombreux, rustique. Au devis avec marque (Tarkett, Berry Floor, Quick-Step)." },
    { q: "Quelle est la planeite minimum requise et faut-il un ragreage ?", r: "Plus ou moins 3 mm sur 2 m (NF DTU 51.2). Au-dela : ragreage obligatoire. Sur ancien parquet ou carrelage : ragreage de 5-10 mm courant." },
    { q: "Comment se passe la vitrification, et combien de couches ?", r: "Bouche-pores 1 couche + finition 3 couches polyurethane. Sechage 24h entre chaque couche, 3 jours total. Ou huilage 2 couches si parquet huile premium." },
    { q: "Quelle garantie sur la pose et les materiaux ?", r: "Decennale 10 ans pose. Garantie constructeur parquet : 10-30 ans (Tarkett, Quick-Step) ou 25-50 ans (massif). Vitrification : 5-10 ans usage normal." },
  ],
  cas_concret: {
    titre: "Anatomie d'une pose parquet massif chene 30 m2",
    texte: "Sur la fiche pro Auxerre 89000, le parqueteur livre : depose ancien linoleum, ragreage Mapei Ultraplan Eco (3 mm), pose collee chene massif Tarkett Heritage 22 mm largeur 110 mm, motif a l'anglaise, bouche-pores Bona Naturale + 3 couches Bona Mega Wave polyurethane mat. Joints dilatation perimetral 10 mm. Plinthes assorties. Total : 3 200 euros TTC (107 euros/m2 tout compris). Garantie 10 ans pose + 30 ans constructeur Tarkett.",
  },
  faq: [
    { q: "Massif ou contrecolle ?", r: "Massif (couche bois unique 18-22 mm) : poncage et vitrification possible 4 a 6 fois sur 100 ans. Contrecolle (couche d'usure 4 mm sur lattes contreplaque) : poncage 1 a 2 fois maxi, dure 30-50 ans. Massif = patrimoine, contrecolle = bon compromis." },
    { q: "Sur quel sol peut-on poser un parquet ?", r: "Sol plan +/- 3 mm/m. Sur carrelage : OK avec sous-couche phonique. Sur ancien parquet : possible si sain, sinon depose. Sur beton frais : attendre 28 jours sechage." },
    { q: "Combien de fois peut-on poncer un parquet ?", r: "Massif 22 mm : 4 a 6 fois (100 ans). Contrecolle 4 mm couche d'usure : 1-2 fois (50 ans). Verifier avant ponce que la couche d'usure le permet." },
    { q: "Combien coute la pose au m2 ?", r: "Stratifie clipse : 25-40 euros/m2 tout compris. Contrecolle chene : 40-70 euros. Massif chene : 50-130 euros. Motif chevron ou point de Hongrie : +30-50 pourcents. Voir /tarifs/parqueteur/." },
  ],
  sources: [
    { label: "UFFEP federation parqueteurs", url: "https://www.uffep.fr/" },
    { label: "FFB metier parquetiers", url: "https://www.ffbatiment.fr/" },
  ],
});

export const GUIDES_BY_METIER: Record<string, GuideMetier> = GUIDES_METIERS.reduce(
  (acc, g) => {
    acc[g.metier] = g;
    return acc;
  },
  {} as Record<string, GuideMetier>,
);
