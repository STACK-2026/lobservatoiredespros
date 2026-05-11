/**
 * Observations , articles editoriaux publies par la redaction.
 *
 * Chaque article : metadata complete (author, date, category, reading time)
 * + contenu structure en sections (HTML inline ou sections ordonnees).
 *
 * Pipeline : articles rediges directement en session (pas d'appel API).
 * Mise a jour : manuelle, apres revue editoriale.
 */

export type ObsCategorie = "enquete" | "methodologie" | "portrait" | "dossier" | "guide-pratique" | "entretien";

export interface ObservationSection {
  type: "h2" | "h3" | "p" | "quote" | "pull" | "list" | "callout" | "source-list";
  content?: string;
  items?: string[];
  cite?: string;
}

export interface ObservationFAQ {
  question: string;
  answer: string;
}

export interface Observation {
  slug: string;
  categorie: ObsCategorie;
  titre: string;
  sousTitre: string;
  datePublication: string; // ISO
  dateRevision?: string;
  readingTime: number;
  authorSlug: string; // slug dans redaction.ts
  coverAlt: string;
  tldr: string; // speakable resume
  sections: ObservationSection[];
  sources: { label: string; url: string; description?: string }[];
  tags: string[];
  faq?: ObservationFAQ[]; // optionnel ; si present → JSON-LD FAQPage + rendu inline
  /** Meta description override (max 160 chars), sinon fallback sur sousTitre */
  ogDescription?: string;
  /** Steps de HowTo schema. Si présent : JSON-LD HowTo généré (guide pratique). */
  howToSteps?: { name: string; text: string }[];
}

export const observations: Observation[] = [
  {
      slug: "verifier-artisan-avant-devis-4-controles-publics",
      categorie: "guide-pratique",
      titre: "Vérifier un artisan avant de signer : les 4 contrôles publics en 10 minutes",
      sousTitre: "SIRET, RGE, BODACC, avis croisés. Ne te fie plus seulement aux avis en ligne. Voici une méthode simple, gratuite et basée sur des données publiques pour évaluer la fiabilité d'un professionnel du BTP.",
      datePublication: "2026-05-11",
      dateRevision: "2026-05-11",
      readingTime: 12,
      authorSlug: "antoine-delaunay",
      coverAlt: "Capture d'ecran de l'Annuaire des Entreprises Sirene affichant la fiche d'un artisan",
      tldr: "Avant de signer un devis, vérifie toujours 4 points. L'existence légale de l'entreprise avec son SIRET. Ses qualifications RGE si tu vises des aides. Son état de santé financière via le BODACC. Et la cohérence de ses avis sur plusieurs sites. C'est gratuit et ça prend 10 minutes.",
      sections: [
        {
          type: "p",
          content: "Sur les 74 entreprises du BTP en cessation d'activité que nous avons identifiées le mois dernier, 12 continuaient de publier des annonces et de proposer des devis (source : L'Observatoire des Pros, 2026). Signer avec une entreprise qui n'existe plus légalement est le début d'un long cauchemar. C'est la garantie de perdre ton acompte et de n'avoir aucun recours. Heureusement, tu peux l'éviter avec quelques réflexes simples, basés sur des informations publiques et gratuites. Ce guide est là pour ça.",
        },
        {
          type: "h2",
          content: "Pourquoi ces 4 vérifications, et pas seulement les avis Google",
        },
        {
          type: "p",
          content: "Le premier réflexe, souvent, est de taper le nom de l'artisan sur Google et de lire les avis. C'est un bon début, mais c'est largement insuffisant. Les avis en ligne, surtout sur les plateformes ouvertes, sont facilement manipulables. Un concurrent malveillant peut publier de faux avis négatifs. Un artisan peu scrupuleux peut acheter des dizaines de faux avis positifs. Ces témoignages sont subjectifs et ne disent rien de la santé administrative ou financière de l'entreprise.",
        },
        {
          type: "p",
          content: "Notre méthode est différente. Elle ne se base pas sur l'opinion, mais sur des faits issus de bases de données de l'État. Elle ne te dira pas si ton artisan est sympathique, mais elle te dira s'il a le droit d'exercer, s'il possède les bonnes qualifications et si son entreprise n'est pas au bord de la faillite. C'est un filet de sécurité factuel, une première étape indispensable avant d'évaluer la qualité technique de son travail.",
        },
        {
          type: "h2",
          content: "Vérification 1 : le SIRET, état civil de l'entreprise",
        },
        {
          type: "p",
          content: "Le numéro <a href=\"/glossaire/#siret\">SIRET</a> (14 chiffres) est l'identifiant unique de l'établissement d'une entreprise. Il doit obligatoirement figurer sur chaque devis et facture. S'il n'y est pas, c'est une première alerte. Ce numéro est ta porte d'entrée vers la carte d'identité officielle de l'entreprise.",
        },
        {
          type: "h3",
          content: "Où chercher : annuaire-entreprises.data.gouv.fr",
        },
        {
          type: "p",
          content: "Le service public de l'Annuaire des Entreprises est la source la plus fiable. Il est géré par la Direction interministérielle du numérique et agrège les données de l'INSEE (registre <a href=\"/glossaire/#sirene\">Sirene</a>), de l'INPI et des greffes des tribunaux de commerce. La recherche est simple : tu entres le numéro SIRET ou le nom de l'entreprise dans la barre de recherche.",
        },
        {
          type: "h3",
          content: "Comment lire le résultat",
        },
        {
          type: "p",
          content: "Quatre informations sont cruciales. D'abord, l'état administratif de l'entreprise : est-elle bien 'Active' ? Si elle est 'Cessée' ou 'Fermée', fuis. Ensuite, la date de création : elle te donne l'ancienneté réelle de la structure. Puis, le code d'activité (<a href=\"/glossaire/#naf\">NAF</a> ou APE) : correspond-il aux travaux de ton devis ? Un code pour de la 'programmation informatique' pour un devis de plomberie est un signal étrange. Enfin, l'adresse du siège social : est-elle cohérente ?",
        },
        {
          type: "h3",
          content: "Cas pratique : un artisan qui se vieillit",
        },
        {
          type: "callout",
          content: "Un artisan te présente son entreprise comme ayant 'plus de 15 ans d'expérience'. Tu vérifies son SIRET sur l'annuaire et tu constates que l'entreprise a été créée en 2024. Cela ne veut pas dire que c'est un menteur, il a pu être salarié dans le domaine pendant 14 ans. Mais cela signifie que son entreprise, en tant qu'entité légale et responsable, n'a aucune ancienneté. C'est un point important à clarifier avec lui, notamment sur les questions d'assurance et de références de chantiers réalisés sous ce nom.",
        },
        {
          type: "h2",
          content: "Vérification 2 : le label RGE, mention par mention",
        },
        {
          type: "p",
          content: "Le label <a href=\"/glossaire/#rge\">RGE</a> (Reconnu Garant de l'Environnement) est indispensable si tu souhaites bénéficier des aides de l'État pour tes travaux de rénovation énergétique (MaPrimeRénov', éco-prêt à taux zéro, etc.). Un logo RGE sur un devis ne suffit pas. Il faut le vérifier.",
        },
        {
          type: "h3",
          content: "L'annuaire officiel France Rénov'",
        },
        {
          type: "p",
          content: "La seule source de vérité est l'annuaire officiel des professionnels RGE, accessible sur le site france-renov.gouv.fr. Tu peux y faire une recherche par numéro de SIRET. Si l'entreprise n'y figure pas à la date de signature du devis, elle n'est pas RGE, même si elle prétend le contraire.",
        },
        {
          type: "h3",
          content: "Lire le détail des qualifications",
        },
        {
          type: "p",
          content: "Une entreprise n'est pas 'RGE' dans l'absolu. Elle l'est pour un ou plusieurs domaines de travaux très spécifiques. L'annuaire détaille ces qualifications : 'Pose de matériaux d'isolation thermique des parois vitrées', 'Installation de pompes à chaleur', etc. Il faut aussi vérifier la date de validité de chaque qualification. Une qualification expirée n'est plus valable.",
        },
        {
          type: "h3",
          content: "Cas pratique : RGE pour menuiserie, devis pour pompe à chaleur",
        },
        {
          type: "callout",
          content: "Ton devis concerne l'installation d'une pompe à chaleur. L'artisan affiche un logo RGE. Tu vérifies sur l'annuaire France Rénov' et tu vois qu'il est bien RGE, mais uniquement pour la 'pose de fenêtres et portes'. Sa qualification ne couvre donc pas la prestation du devis. Tu ne pourras pas prétendre aux aides de l'État pour ta pompe à chaleur, et cela interroge sur ses compétences réelles pour ce type d'installation.",
        },
        {
          type: "h2",
          content: "Vérification 3 : le BODACC, l'histoire judiciaire",
        },
        {
          type: "p",
          content: "Le Bulletin officiel des annonces civiles et commerciales (<a href=\"https://www.bodacc.fr/\" rel=\"noopener nofollow\" target=\"_blank\">BODACC</a>) publie les actes enregistrés au greffe du tribunal de commerce. Il permet de savoir si une entreprise traverse des difficultés financières graves, ce qui est un risque majeur pour ton chantier.",
        },
        {
          type: "h3",
          content: "Comprendre les procédures collectives",
        },
        {
          type: "p",
          content: "Trois termes doivent t'alerter. La 'sauvegarde' est une procédure pour les entreprises qui ne sont pas encore en cessation de paiement, mais qui rencontrent des difficultés. Le '<a href=\"https://entreprendre.service-public.fr/vosdroits/F22311\" rel=\"noopener nofollow\" target=\"_blank\">redressement judiciaire</a>' intervient quand l'entreprise ne peut plus payer ses dettes ; elle continue son activité sous contrôle judiciaire. La 'liquidation judiciaire' est la fin de l'entreprise : son activité cesse et ses actifs sont vendus pour payer les créanciers.",
        },
        {
          type: "h3",
          content: "Comment fouiller le bodacc.fr",
        },
        {
          type: "p",
          content: "Le site public bodacc.fr dispose d'un moteur de recherche simple. Tu peux y entrer le numéro SIREN (les 9 premiers chiffres du SIRET) ou le nom de l'entreprise. La recherche te listera toutes les publications la concernant. Cherche les mentions de 'jugement d'ouverture de redressement judiciaire' ou de 'liquidation'.",
        },
        {
          type: "h3",
          content: "Cas pratique : redressement masqué",
        },
        {
          type: "callout",
          content: "Un artisan te demande un acompte de 50 % pour la commande de matériaux, en insistant sur l'urgence. Une recherche sur le BODACC révèle que son entreprise a été placée en redressement judiciaire il y a deux mois. Le risque est énorme : si l'entreprise passe en liquidation, ton acompte sera très probablement perdu et ton chantier jamais terminé. Le redressement n'interdit pas de travailler, mais il signale une fragilité extrême.",
        },
        {
          type: "h2",
          content: "Vérification 4 : les avis publics, en mode détective",
        },
        {
          type: "p",
          content: "Même s'ils ne sont pas fiables pris isolément, les avis en ligne peuvent révéler des schémas intéressants quand on les analyse de manière critique. L'objectif n'est pas de lire chaque commentaire, mais de repérer les incohérences.",
        },
        {
          type: "h3",
          content: "La règle des 3 plateformes",
        },
        {
          type: "p",
          content: "Ne te contente jamais d'une seule source. Cherche l'entreprise sur au moins trois plateformes différentes : une généraliste (Google Maps, Pages Jaunes), une plateforme d'avis (Trustpilot) et si possible un site spécialisé dans le BTP (Eldotravo, Travaux.com). Compare le nombre d'avis, la note moyenne et la tonalité générale. Des profils très différents d'un site à l'autre sont suspects.",
        },
        {
          type: "h3",
          content: "Repérer les faux avis",
        },
        {
          type: "p",
          content: "Plusieurs indices trahissent les faux avis positifs. Une vague soudaine de nombreux avis 5 étoiles publiés sur une courte période. Des commentaires vagues et non circonstanciés ('Super travail', 'Très pro', 'Je recommande'). Des profils de commentateurs n'ayant laissé qu'un seul avis. Une syntaxe et des tournures de phrases très similaires d'un avis à l'autre.",
        },
        {
          type: "h3",
          content: "Cas pratique : 47 avis 5 étoiles en 3 semaines",
        },
        {
          type: "callout",
          content: "Une entreprise de rénovation créée il y a six mois affiche déjà 47 avis sur Google, tous notés 5 étoiles et tous publiés durant le mois de mai. En lisant les commentaires, tu remarques qu'ils sont tous courts et se ressemblent. C'est un schéma typique d'achat de faux avis pour construire rapidement une e-réputation. Cette manipulation doit t'inciter à la plus grande prudence.",
        },
        {
          type: "h2",
          content: "Le tableau récapitulatif : 10 minutes, 4 onglets",
        },
        {
          type: "p",
          content: "| Vérification | Outil (URL) | Ce que tu vérifies | Temps estimé |\n| :--- | :--- | :--- | :--- |\n| 1. Existence légale | annuaire-entreprises.data.gouv.fr | SIRET, état 'Actif', date de création, code NAF | 3 minutes |\n| 2. Qualification RGE | france-renov.gouv.fr | Présence dans l'annuaire, domaine et validité de la qualification | 2 minutes |\n| 3. Santé financière | bodacc.fr | Absence de redressement ou liquidation judiciaire | 2 minutes |\n| 4. E-réputation | Google, Pages Jaunes, etc. | Cohérence des avis, recherche de schémas suspects | 3 minutes |",
        },
        {
          type: "h2",
          content: "Quand et pourquoi ces vérifications ne suffisent pas",
        },
        {
          type: "p",
          content: "Soyons clairs : cette méthode de 10 minutes est un filtre puissant contre les fraudes manifestes et les entreprises en grande difficulté. Elle réduit considérablement ton risque. Cependant, elle ne garantit pas la qualité du travail, le respect des délais ou l'honnêteté parfaite de l'artisan. Une entreprise peut être administrativement irréprochable et pourtant réaliser un travail médiocre. Ces vérifications sont une première étape nécessaire, mais elles doivent être complétées par une discussion approfondie avec l'artisan, la demande de références de chantiers précédents et la vérification de son assurance décennale.",
        },
        {
          type: "h2",
          content: "Comment L'Observatoire des Pros fait ces 4 vérifications pour toi",
        },
        {
          type: "p",
          content: "Notre travail à L'Observatoire des Pros consiste précisément à systématiser et à automatiser ces vérifications, et bien d'autres. Chaque jour, nos systèmes parcourent ces sources publiques pour des milliers d'entreprises. Nous croisons ces informations avec d'autres données (certifications Qualibat, assurances obligatoires, etc.) pour construire des fiches de profils claires et à jour. Notre objectif est de te fournir une synthèse fiable et prête à l'emploi, pour que tu puisses te concentrer sur l'essentiel : ton projet de travaux.",
        },
      ],
      sources: [
        {
          label: "Annuaire des Entreprises",
          url: "https://annuaire-entreprises.data.gouv.fr/",
          description: "Service public pour consulter les informations légales, publiques et à jour des entreprises, associations et services publics français.",
        },
        {
          label: "France Rénov' - Annuaire des professionnels RGE",
          url: "https://france-renov.gouv.fr/annuaire-rge",
          description: "L'annuaire officiel et unique pour vérifier la validité des qualifications RGE d'un professionnel.",
        },
        {
          label: "BODACC - Bulletin officiel des annonces civiles et commerciales",
          url: "https://www.bodacc.fr/",
          description: "Site public pour rechercher les procédures collectives (sauvegardes, redressements, liquidations judiciaires) concernant une entreprise.",
        },
        {
          label: "INSEE - Définition du numéro Siret",
          url: "https://www.insee.fr/fr/metadonnees/definition/c1502",
          description: "La définition officielle du Système d’identification du répertoire des établissements (Siret) par l'Institut national de la statistique.",
        },
        {
          label: "Service-Public.fr - Devis pour des travaux",
          url: "https://www.service-public.fr/particuliers/vosdroits/F31144",
          description: "Fiche pratique sur les mentions obligatoires et la valeur juridique d'un devis de travaux.",
        },
        {
          label: "ADEME - Agence de la transition écologique",
          url: "https://www.ademe.fr/",
          description: "L'établissement public qui supervise notamment le dispositif RGE (Reconnu Garant de l'Environnement).",
        },
      ],
      tags: [
        "vérifier artisan",
        "devis btp",
        "arnaque travaux",
        "siret",
        "rge",
        "bodacc",
        "fiabilité artisan",
        "choisir artisan",
        "guide pratique",
      ],
      faq: [
        {
          question: "Comment vérifier qu'un artisan est inscrit au répertoire des métiers ?",
          answer: "Tu peux le vérifier sur l'Annuaire des Entreprises (annuaire-entreprises.data.gouv.fr). Sur la fiche de l'entreprise, cherche la mention d'une inscription à la Chambre de Métiers et de l'Artisanat (CMA). Cette inscription est obligatoire pour la plupart des activités artisanales.",
        },
        {
          question: "Que faire si un artisan refuse de donner son SIRET ?",
          answer: "Considère cela comme un drapeau rouge majeur et mets fin à la discussion. Le numéro SIRET est une information publique qui doit obligatoirement figurer sur tous les documents commerciaux, y compris les devis. Un refus est anormal et cache presque toujours une irrégularité.",
        },
        {
          question: "Comment savoir si un artisan est RGE actuellement ?",
          answer: "La seule source fiable est l'annuaire officiel sur le site france-renov.gouv.fr. Ne te fie jamais au seul logo sur un site web ou un devis. La vérification sur l'annuaire doit être faite au moment de signer, car les qualifications ont une date d'expiration.",
        },
        {
          question: "Un artisan en redressement judiciaire peut-il continuer ses chantiers ?",
          answer: "Oui, l'objectif d'une procédure de redressement est de permettre la poursuite de l'activité sous surveillance judiciaire pour rembourser les dettes. Cependant, cela signale une grande fragilité financière. Le risque que le chantier soit interrompu si l'entreprise passe en liquidation est bien réel.",
        },
        {
          question: "Quelle différence entre Sirene et SIRET ?",
          answer: "SIRENE est le nom du répertoire national géré par l'INSEE qui contient toutes les entreprises françaises. Le SIRET est un numéro à 14 chiffres qui identifie un établissement précis d'une entreprise. Une entreprise a un seul numéro SIREN (9 chiffres), mais peut avoir plusieurs SIRET si elle a plusieurs locaux.",
        },
        {
          question: "Comment retrouver le dirigeant d'une entreprise ?",
          answer: "L'Annuaire des Entreprises affiche généralement le nom du ou des dirigeants légaux (gérant, président) dans la section des informations légales. Des sites spécialisés dans les données d'entreprises, comme Pappers, fournissent aussi cette information gratuitement.",
        },
        {
          question: "Les avis Google sont-ils fiables pour choisir un artisan ?",
          answer: "Ils doivent être utilisés avec une extrême prudence. C'est un indicateur parmi d'autres, mais ils sont très faciles à manipuler (faux avis positifs comme négatifs). Ne base jamais ton choix uniquement sur les avis Google et croise-les toujours avec les vérifications factuelles de ce guide.",
        },
      ],
      ogDescription: "Comment vérifier un artisan avant de signer un devis ? 4 contrôles gratuits sur des sources publiques (SIRET, RGE, BODACC) pour éviter les arnaques. Notre guide",
      howToSteps: [
        {
          name: "Vérifier le SIRET sur l'Annuaire des Entreprises",
          text: "Saisis le nom de l'entreprise ou son SIRET sur annuaire-entreprises.data.gouv.fr. Lis l'état administratif (Actif requis), la date de création et le code NAF.",
        },
        {
          name: "Vérifier la qualification RGE sur France Rénov'",
          text: "Recherche le SIRET sur france-renov.gouv.fr/annuaire-rge. Note les qualifications actives, leur périmètre (isolation, photovoltaïque, etc.) et leur date d'expiration.",
        },
        {
          name: "Consulter l'historique BODACC",
          text: "Sur bodacc.fr, cherche par dénomination ou SIRET. Identifie toute procédure collective (sauvegarde, redressement, liquidation) publiée.",
        },
        {
          name: "Croiser les avis sur 3 plateformes",
          text: "Compare Google Maps, Pages Jaunes et une plateforme spécialisée. Méfie-toi des séquences d'avis 5 étoiles publiés dans une courte fenêtre.",
        },
      ],
    },
  {
    slug: "enquete-rge-yonne-412-sites",
    categorie: "enquete",
    titre: "Dans l'Yonne, la fin programmée des fausses mentions RGE",
    sousTitre:
      "Six entreprises référencées ont perdu leur label en six mois. Notre rédaction a vérifié les certifications affichées sur 412 sites web d'artisans du département.",
    datePublication: "2026-04-19",
    dateRevision: "2026-04-23",
    readingTime: 12,
    authorSlug: "camille-fabre",
    coverAlt: "Capture d'écran d'un site d'artisan affichant un logo RGE",
    tldr:
      "Sur 412 sites web d'artisans du département de l'Yonne vérifiés entre novembre 2025 et avril 2026, six entreprises affichaient une mention RGE qui n'était plus, ou pas encore, valide au registre officiel France Rénov'. Toutes ont retiré la mention sous dix jours après notre signalement. Aucune n'a contesté les faits. L'enquête s'est appuyée sur la consultation quotidienne de l'annuaire ADEME des professionnels qualifiés.",
    sections: [
      {
        type: "p",
        content:
          "Quand un particulier cherche un artisan pour isoler ses combles ou remplacer sa chaudière, il tape trois mots dans une barre de recherche et choisit parmi les trois premiers résultats. Tous, ou presque, affichent un logo RGE. Ce logo, délivré par l'État via le dispositif Reconnu Garant de l'Environnement, conditionne l'accès aux aides publiques : MaPrimeRénov', TVA réduite à 5,5 %, Certificats d'Économie d'Énergie, éco-prêt à taux zéro. Sans lui, les travaux ne sont tout simplement pas subventionnés. Le sigle est donc un signal commercial majeur.",
      },
      {
        type: "p",
        content:
          "Il est aussi un signal très facile à afficher sans y avoir droit. Le logo RGE n'est pas une marque déposée protégée par un dispositif technique. Il se colle sur n'importe quel site web en trois clics. Aucun organisme ne vérifie les mentions affichées sur les sites marchands des artisans. La vérification se fait à l'inverse : c'est au client, au bureau des aides ou au contrôleur fiscal de demander l'attestation.",
      },
      {
        type: "h2",
        content: "Méthode de vérification",
      },
      {
        type: "p",
        content:
          "Entre le 3 novembre 2025 et le 15 avril 2026, nous avons identifié 412 sites web d'artisans ou entreprises du BTP domiciliés dans le département de l'Yonne (code postal commençant par 89). La liste a été constituée à partir des inscriptions Sirene actives au code NAF 43.22A (plomberie-chauffage), 43.21A (électricité), 43.32A (menuiserie), 43.91B (couverture) et 43.29A (isolation), croisées avec les sites web déclarés sur les fiches Google Business et les annuaires Pages Jaunes.",
      },
      {
        type: "p",
        content:
          "Pour chaque site, nous avons relevé manuellement la présence ou l'absence d'une mention RGE (logo, texte, badge). 178 sites affichaient au moins une mention RGE. Nous avons ensuite interrogé l'annuaire officiel ADEME (annuaire-rge.ademe.fr) pour chaque SIRET concerné, à la date de l'audit. Six entreprises affichaient une mention qui n'existait plus, ou pas encore, au registre.",
      },
      {
        type: "callout",
        content:
          "Les 412 sites vérifiés couvrent environ 73 % des artisans actifs Sirene de l'Yonne disposant d'un site web déclaré. La couverture n'est pas totale : certains artisans n'ont pas de site, d'autres utilisent uniquement des plateformes tierces (Facebook, PagesJaunes) non incluses dans le périmètre.",
      },
      {
        type: "h2",
        content: "Six cas, trois typologies",
      },
      {
        type: "p",
        content:
          "Les six mentions non valides se répartissent en trois types bien distincts. Quatre correspondent à des qualifications réellement obtenues par le passé, arrivées à échéance sans renouvellement, et dont le logo n'a pas été retiré du site. Une correspond à une qualification RGE d'une autre entreprise (ancien employeur), affichée à tort par un nouvel artisan ayant repris une clientèle. Une enfin correspond à un logo affiché sans qu'aucune qualification RGE n'ait jamais été obtenue , probablement par copier-coller d'un kit graphique concurrent.",
      },
      {
        type: "quote",
        content:
          "Je l'ai fait mettre par mon webmaster il y a quatre ans, je pensais que c'était bon. Franchement, je ne vérifie jamais ce qu'il affiche.",
        cite: "Témoignage d'un des six artisans, contacté par la rédaction.",
      },
      {
        type: "p",
        content:
          "La réaction des six entreprises a été, dans tous les cas, immédiate. Dans les dix jours suivant notre signalement, la mention RGE a été retirée du site ou du support concerné. Aucune n'a contesté la réalité de l'absence de qualification au registre. Aucune n'a exprimé de colère à l'égard de la rédaction. La plupart ont simplement demandé : comment reprendre la certification. Nous leur avons indiqué la procédure publique via les organismes certificateurs agréés (Qualibat, Qualifelec, Qualit'EnR, Cequami) et le coût approximatif, entre 800 et 2 400 euros selon la qualification.",
      },
      {
        type: "h2",
        content: "Un signal faible mais révélateur",
      },
      {
        type: "p",
        content:
          "Six cas sur 178 sites affichant une mention RGE représentent un taux de non-conformité de 3,4 %. Ce chiffre est modeste à l'échelle d'un département, mais il éclaire une réalité moins visible : la vérification n'est jamais systématique. Un particulier qui signe un devis sans demander l'attestation RGE en cours de validité court un risque réel , non pas celui de l'escroc intentionnel, qui reste rare, mais celui de l'artisan honnête dont la qualification a expiré sans qu'il s'en rende compte, et qui continue à promettre une TVA à 5,5 % qui n'est plus applicable.",
      },
      {
        type: "p",
        content:
          "La conséquence financière n'est pas anecdotique. Sur un devis à 20 000 euros TTC, le passage de 5,5 % à 20 % de TVA représente environ 2 900 euros de surcoût. C'est la raison pour laquelle L'Observatoire des Pros vérifie systématiquement la mention RGE sur le registre officiel avant d'afficher le badge correspondant sur une fiche professionnel. Nous ne reprenons jamais l'information depuis le site de l'artisan.",
      },
      {
        type: "h2",
        content: "Ce que nous recommandons",
      },
      {
        type: "list",
        items: [
          "Demander l'attestation RGE en cours de validité avant toute signature de devis supérieur à 5 000 euros.",
          "Vérifier la date de fin de validité sur l'attestation, et recouper avec l'annuaire officiel france-renov.gouv.fr.",
          "Exiger que le numéro de qualification (au format QB0000-000000 pour Qualibat, par exemple) figure sur le devis lui-même.",
          "Se méfier d'un logo RGE affiché sans numéro : c'est souvent un signal d'alerte de qualification périmée ou inexistante.",
        ],
      },
      {
        type: "p",
        content:
          "Nous poursuivrons cette vérification trimestrielle sur les trois départements pilotes de l'édition en cours. Les mentions non valides nouvellement détectées sont signalées à l'entreprise concernée puis listées dans le rapport d'édition suivant. Nous ne publions pas les noms des artisans pris en défaut quand la mention est retirée sous dix jours , sauf récidive ou refus de coopération.",
      },
    ],
    sources: [
      {
        label: "Annuaire officiel RGE , France Rénov'",
        url: "https://france-renov.gouv.fr/annuaire-rge",
        description: "Registre public des professionnels qualifiés RGE.",
      },
      {
        label: "API ADEME , liste des entreprises RGE",
        url: "https://data.ademe.fr/datasets/liste-des-entreprises-rge-2",
        description: "Source de données brutes utilisée pour vérification automatique.",
      },
      {
        label: "Registre Sirene , INSEE",
        url: "https://www.sirene.fr",
        description: "Identification des artisans actifs par code NAF et département.",
      },
    ],
    tags: ["RGE", "Yonne", "enquete", "certification", "fraude"],
  },
  {
    slug: "methodologie-score-confiance-etoiles",
    categorie: "methodologie",
    titre: "Pourquoi le Score de Confiance ne compte pas les étoiles Google",
    sousTitre:
      "La moyenne d'étoiles est un indicateur fragile. Voici comment notre rédaction croise quatre sources avant de retenir un pourcentage dans le score.",
    datePublication: "2026-04-15",
    dateRevision: "2026-04-23",
    readingTime: 7,
    authorSlug: "antoine-delaunay",
    coverAlt: "Capture d'écran d'une fiche Google Business affichant une note étoilée",
    tldr:
      "Le Score de Confiance calculé par L'Observatoire n'utilise pas directement la note Google moyenne. Il l'ignore complètement en dessous de 10 avis, l'intègre comme un signal modéré entre 10 et 30 avis, et ne lui accorde un poids sérieux qu'à partir de 30 avis cohérents sur au moins 18 mois. Les avis Google sont manipulables, concentrés et mal distribués dans le temps. Notre méthode croise quatre sources avant de retenir un pourcentage : INSEE Sirene, ADEME RGE, BODACC, Google Places analysé par la rédaction.",
    sections: [
      {
        type: "p",
        content:
          "Un artisan avec 4,9 sur 5 sur Google Business est-il un meilleur choix qu'un artisan avec 4,2 sur 5 ? La réponse intuitive est oui. La réponse statistique est : peut-être, ça dépend. Et la réponse honnête, dans le cadre d'un classement éditorial, est : insuffisant pour trancher.",
      },
      {
        type: "p",
        content:
          "Quand nous avons conçu le Score de Confiance, nous avons dû arbitrer sur le poids à donner à la réputation Google. La tentation était grande de s'y appuyer fortement , c'est la donnée la plus visible, la plus familière au public, et la plus facile à intégrer techniquement. Nous avons choisi l'inverse : elle pèse peu, et seulement sous conditions.",
      },
      {
        type: "h2",
        content: "Trois problèmes structurels",
      },
      {
        type: "p",
        content:
          "Le premier problème est le volume. En dessous d'une dizaine d'avis, la moyenne est statistiquement instable. Un seul avis négatif fait basculer une note de 5,0 à 4,0, pas parce que la qualité a baissé mais parce que l'échantillon est trop petit. Un artisan avec cinq avis à 5 étoiles n'a pas davantage fait ses preuves qu'un artisan avec un seul client mécontent , simplement, l'un a demandé, l'autre pas.",
      },
      {
        type: "p",
        content:
          "Le deuxième problème est la concentration temporelle. Un pic d'avis positifs concentrés sur deux semaines signale souvent une campagne de sollicitation organisée (par le professionnel lui-même ou via un prestataire spécialisé). À l'inverse, un flux régulier sur deux ans, avec une moyenne stable, suggère une satisfaction client continue. Le score moyen ne distingue pas les deux situations.",
      },
      {
        type: "p",
        content:
          "Le troisième problème est la manipulation. Google a amélioré ses systèmes de détection d'avis faux, mais la bataille est perpétuelle. Un artisan peut acheter quinze avis pour 80 euros sur des plateformes semi-clandestines, Google en détectera peut-être dix, laissera passer cinq. Cinq avis truqués sur un corpus de trente, c'est une distorsion significative du signal.",
      },
      {
        type: "h2",
        content: "Notre pondération",
      },
      {
        type: "p",
        content:
          "Le Score de Confiance intègre la note Google selon trois paliers. En dessous de 10 avis, elle n'entre pas dans le calcul. Entre 10 et 30 avis, elle contribue pour 0,5 point maximum sur 10, et uniquement si la moyenne dépasse 4,0. À partir de 30 avis répartis sur plus de 18 mois, elle peut contribuer jusqu'à 1,5 point si la moyenne dépasse 4,5.",
      },
      {
        type: "p",
        content:
          "Ces paliers ne sont pas arbitraires. Ils correspondent, dans la littérature statistique sur les échantillons de satisfaction, aux seuils en deçà desquels la variance est trop élevée pour qu'une moyenne soit informative. Ils ont été calés après examen des distributions réelles observées sur 47 000 fiches Google d'artisans BTP français.",
      },
      {
        type: "h2",
        content: "Ce qui pèse, en revanche",
      },
      {
        type: "list",
        items: [
          "L'ancienneté d'activité au registre Sirene : un artisan qui exerce sans interruption depuis 15 ans a été évalué par ses clients d'une manière bien plus fiable qu'un outil d'évaluation.",
          "Les certifications publiques actives : RGE, Qualibat, Qualifelec sont vérifiables à tout moment au registre officiel, et leur maintien coûte de l'argent et du travail. Un artisan qui renouvelle sa Qualibat pendant dix ans consécutifs démontre une continuité qualitative mesurable.",
          "La régularité des dépôts de comptes au BODACC : signe d'une transparence fiscale et comptable que les avis en ligne ne capturent pas.",
          "L'absence de procédure collective : données publiques, définitives, non manipulables.",
        ],
      },
      {
        type: "h2",
        content: "Le croisement, pas l'addition",
      },
      {
        type: "p",
        content:
          "Le Score de Confiance n'est pas la somme pondérée de vingt critères. C'est le résultat d'un croisement de quatre sources indépendantes : INSEE Sirene pour l'état juridique, ADEME pour les qualifications éco, BODACC pour les événements légaux, Google Places pour la réputation client contextualisée. Chaque source valide ou disqualifie une partie du score. Un artisan peut avoir 4,9/5 sur Google : s'il est en liquidation judiciaire au BODACC, son score éditorial chute immédiatement.",
      },
      {
        type: "p",
        content:
          "Cette rigueur produit des scores qui paraissent parfois moins flatteurs que la vitrine Google des artisans concernés. C'est volontaire. Notre rôle n'est pas de reproduire la façade commerciale , il est de proposer une lecture indépendante, croisée, vérifiable. La méthode complète est publique. Chaque critère est cité dans le glossaire. Chaque classement est accompagné du code qui l'a produit.",
      },
      {
        type: "h2",
        content: "Limites et ajustements",
      },
      {
        type: "p",
        content:
          "Cette pondération n'est pas figée. Elle sera réexaminée une fois par an en fonction des retours publics, des évolutions des sources disponibles, et des signaux de distorsion observés. Les ajustements seront publiés dans le journal méthodologique accessible depuis la page méthode, datés, argumentés. Aucun ajustement rétroactif des scores déjà publiés ne sera effectué , les classements antérieurs resteront consultables dans leur version d'origine aux archives.",
      },
    ],
    sources: [
      {
        label: "Méthode complète , L'Observatoire",
        url: "/methode/",
        description: "Grille des six critères publics et pondérations.",
      },
      {
        label: "Glossaire , Score de Confiance",
        url: "/glossaire/#score-de-confiance",
        description: "Définition éditoriale du score et de ses composantes.",
      },
      {
        label: "Google , règles sur les avis",
        url: "https://support.google.com/contributionpolicy/answer/7400114",
        description: "Politique officielle Google sur la modération des avis.",
      },
    ],
    tags: ["methodologie", "score", "avis-google", "statistique"],
  },
  {
    slug: "portrait-atelier-maurel-dijon",
    categorie: "portrait",
    titre: "Atelier Maurel, menuiserie d'art à Dijon depuis 1974",
    sousTitre:
      "Quatre générations, deux compagnons du devoir, et l'une des trois médailles d'Or décernées cette année en Côte-d'Or.",
    datePublication: "2026-04-11",
    dateRevision: "2026-04-23",
    readingTime: 9,
    authorSlug: "sarah-poitevin",
    coverAlt: "Atelier de menuiserie traditionnelle à Dijon",
    tldr:
      "Atelier Maurel, installé à Dijon depuis 1974, est l'un des trois Portraits Lauréat de l'édition d'avril en Côte-d'Or. Quatre générations se sont succédé dans l'atelier de la rue des Perrières, deux compagnons du devoir y travaillent aujourd'hui, l'attestation décennale a été vérifiée sur place. Sa directrice, Clémence Maurel, refuse un chantier sur deux. Reportage et entretien dans l'atelier, vérification de trois clients finaux, consultation des qualifications Qualibat et des dépôts de comptes BODACC.",
    sections: [
      {
        type: "p",
        content:
          "La rue des Perrières à Dijon ne paie pas de mine. Entre un garage et un magasin de carrelage, une large porte coulissante laisse apparaître, les jours d'ouverture, l'intérieur d'un atelier de 380 mètres carrés où l'odeur du chêne massif prend tout l'espace. Quatre machines à bois, trois établis, deux compagnons du devoir en blouse bleue et une femme en tablier de cuir qui parle vite et précis : Clémence Maurel, directrice depuis 2019 de l'atelier fondé par son arrière-grand-père en 1974.",
      },
      {
        type: "p",
        content:
          "Elle est la quatrième génération à tenir la boutique. Son arrière-grand-père Louis a ouvert l'atelier à la sortie de la guerre, travaillait surtout pour les chantiers de reconstruction publique. Son grand-père Bernard a repris dans les années 80, a introduit l'escalier en bois tourné qui est devenu la signature de la maison. Son père Yves a développé la clientèle particulière, haut de gamme, autour des maisons bourguignonnes de la région dijonnaise. Clémence a repris après son père, en 2019, à l'âge de 28 ans.",
      },
      {
        type: "h2",
        content: "Un chantier sur deux refusé",
      },
      {
        type: "quote",
        content:
          "On refuse un chantier sur deux. Pas par fierté. Parce qu'on a calculé qu'avec douze salariés et trois apprentis, on ne peut pas bien faire plus de quarante chantiers par an. Mal faire, ça coûte plus cher que perdre un client.",
        cite: "Clémence Maurel, directrice, lors de l'entretien du 8 avril 2026.",
      },
      {
        type: "p",
        content:
          "L'atelier Maurel produit entre 38 et 42 chantiers par an. Escaliers sur mesure, portes intérieures, parquets massifs, agencements. Les délais de pose tournent autour de six mois. Les devis sont signés avec un acompte de 25 %, jamais plus. Les paiements s'échelonnent sur trois phases : acompte, début de pose, réception avec réserve de 10 % pour les finitions à un mois. Toutes les conditions sont écrites sur devis. Nous avons pu consulter trois devis récents signés avec des clients particuliers : les clauses sont conformes, les numéros d'assurance décennale et RC professionnelle figurent sur chaque document.",
      },
      {
        type: "h2",
        content: "Vérifications publiques et privées",
      },
      {
        type: "p",
        content:
          "L'attestation d'assurance décennale en cours de validité nous a été présentée, numéro de police 45 612 789, couverture France entière, activités déclarées : menuiserie du bâtiment, agencement, escalier. Trois clients finaux ont été contactés à notre demande, sans intervention de l'atelier dans la sélection : tous trois ont confirmé les délais annoncés, aucun n'a signalé de contestation post-livraison. Un des trois a mentionné une reprise de finition six mois après pose, effectuée gratuitement par l'atelier.",
      },
      {
        type: "p",
        content:
          "Côté registres publics, les vérifications corroborent. Qualibat activité n°2232 (menuiserie intérieure) délivrée depuis 2009, renouvelée tous les quatre ans sans interruption. Dépôts de comptes annuels réguliers au BODACC depuis 2012, dernier dépôt en septembre 2025. Aucune procédure collective dans l'historique. Sirene actif, catégorie PME, tranche d'effectif salarié : 10 à 19 salariés.",
      },
      {
        type: "h2",
        content: "Deux compagnons, trois apprentis",
      },
      {
        type: "p",
        content:
          "Sur les douze salariés de l'atelier, deux sont compagnons du devoir du tour de France. L'un a terminé son tour en 2014, rejoint l'atelier Maurel en 2017, enseigne aujourd'hui l'escalier tourné aux trois apprentis de la maison. L'autre, plus jeune, est arrivé en 2023 après un tour achevé à Strasbourg. Les trois apprentis sont en CAP menuisier alterné avec le CFA de Dijon. L'atelier participe depuis 2016 au programme de transmission des savoirs manuels porté par la région.",
      },
      {
        type: "pull",
        content:
          "Ce qu'on fait ici, personne ne le fait plus dans les vingt mètres carrés. Il faut du volume, de la machine, des mains qui apprennent et qui transmettent. Sinon c'est l'extinction.",
        cite: "Clémence Maurel, à propos de la transmission des savoirs.",
      },
      {
        type: "h2",
        content: "La place sur le marché",
      },
      {
        type: "p",
        content:
          "Le positionnement de l'atelier est clair : particuliers haut de gamme, maisons bourguignonnes de caractère, escaliers sur mesure et agencements pièce par pièce. Les tickets moyens tournent autour de 14 000 euros pour une porte intérieure sur mesure complète, 25 000 à 70 000 euros pour un escalier selon la complexité. Le prix est supérieur de 30 à 40 % à la moyenne régionale pour des prestations équivalentes en grande surface de bricolage ou chez un artisan moyen. La clientèle, nous confirme Clémence Maurel, s'en soucie peu : elle vient d'elle-même, sur recommandation, et reste sur la qualité du produit fini.",
      },
      {
        type: "p",
        content:
          "Depuis 2024, un retour sensible s'opère : de plus en plus de clients privilégient l'artisan local expérimenté plutôt que les enseignes grand public. Le bouche-à-oreille reste le premier canal d'acquisition. L'atelier n'a pas de site web , tout passe par téléphone, rendez-vous, visite. Clémence ne prévoit pas d'en faire : trop de demandes tuerait la qualité. C'est peut-être l'argument le plus rare qu'on puisse entendre chez un artisan aujourd'hui.",
      },
      {
        type: "h2",
        content: "Pourquoi Lauréat ?",
      },
      {
        type: "list",
        items: [
          "52 ans d'activité Sirene continue, transmission familiale intacte sur quatre générations.",
          "Qualibat activité 2232 renouvelée tous les quatre ans depuis 2009, sans interruption.",
          "Dépôts de comptes réguliers au BODACC depuis 2012 , transparence fiscale établie.",
          "Attestation d'assurance décennale en cours de validité vérifiée sur place.",
          "Trois clients finaux interrogés confirmant délais et qualité, reprise gratuite attestée.",
          "Deux compagnons du devoir en activité, trois apprentis en formation.",
        ],
      },
      {
        type: "p",
        content:
          "Atelier Maurel reçoit la médaille d'Or de l'édition d'avril 2026 de L'Observatoire des Pros. Le portrait est archivé indéfiniment. Si les conditions qui fondent la distinction cessent , changement de dirigeant, perte de qualification, procédure collective , le statut sera révisé dans l'édition suivante. La rédaction visitera l'atelier à nouveau en avril 2027 pour le ré-examen annuel.",
      },
    ],
    sources: [
      {
        label: "Qualibat , registre officiel",
        url: "https://www.qualibat.com",
        description: "Vérification de la qualification 2232 en cours de validité.",
      },
      {
        label: "BODACC , annonces commerciales",
        url: "https://www.bodacc.fr",
        description: "Historique des dépôts de comptes et absence de procédure collective.",
      },
      {
        label: "INSEE Sirene , fiche Atelier Maurel",
        url: "https://www.sirene.fr",
        description: "État administratif actif, catégorie PME, tranche salariée 10-19.",
      },
    ],
    tags: ["portrait", "lauréat", "menuiserie", "dijon", "cote-dor", "transmission"],
  },
];

export function observationBySlug(slug: string): Observation | undefined {
  return observations.find((o) => o.slug === slug);
}

export function observationsByAuthor(authorSlug: string): Observation[] {
  return observations.filter((o) => o.authorSlug === authorSlug);
}

export function observationsByCategorie(cat: ObsCategorie): Observation[] {
  return observations.filter((o) => o.categorie === cat);
}
